import crypto from 'crypto';
import admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Google Secret Manager secrets (never stored in client code or Firestore client-readable docs)
const SECUREYE_CLOUD_API_KEY = defineSecret('SECUREYE_CLOUD_API_KEY');
const SECUREYE_WEBHOOK_SECRET = defineSecret('SECUREYE_WEBHOOK_SECRET');

const CLOUD_HEARTBEAT_WINDOW_MS = 5 * 60_000; // 5 minutes

/**
 * Persist a structured synchronization / diagnostic log entry in Firestore.
 */
async function writeSyncLog({
  level = 'info',
  eventType,
  deviceId = null,
  deviceSn = null,
  biometricUserId = null,
  memberId = null,
  message,
  details = null,
}) {
  try {
    await db.collection('biometric_sync_logs').add({
      timestamp: new Date().toISOString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      level,
      eventType,
      deviceId,
      deviceSn,
      biometricUserId,
      memberId,
      message,
      details,
    });
  } catch (err) {
    console.error('[writeSyncLog] Failed to persist log:', err);
  }
}

/**
 * Constant-time string comparison for webhook secret verification.
 */
function safeEqual(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(String(a), 'utf8');
  const bufB = Buffer.from(String(b), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify Firebase Auth Admin ID Token for Admin Panel requests.
 */
async function verifyAdminRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      error: 'Missing Firebase Authentication Bearer token. Sign in as an Admin first.',
    };
  }

  const idToken = authHeader.slice(7).trim();
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email || '';
    const hasAdminClaim =
      decoded.admin === true ||
      decoded.role === 'admin' ||
      /@gympro\.(com|in)$/i.test(email);

    if (hasAdminClaim) {
      return { ok: true, user: decoded };
    }

    const adminDoc = await db.collection('admins').doc(decoded.uid).get();
    if (adminDoc.exists) {
      return { ok: true, user: decoded };
    }

    return {
      ok: false,
      status: 403,
      error:
        'Signed-in user does not have Admin permissions (missing admin claim or admins/{uid} document).',
    };
  } catch (err) {
    return {
      ok: false,
      status: 401,
      error: `Firebase Auth token verification failed: ${err.message}`,
    };
  }
}

/**
 * Verify incoming Secureye Cloud Webhook requests using Google Secret Manager (SECUREYE_WEBHOOK_SECRET).
 */
async function verifyWebhookSecret(req) {
  const configuredSecret =
    process.env.SECUREYE_WEBHOOK_SECRET || SECUREYE_WEBHOOK_SECRET.value();

  if (!configuredSecret) {
    return {
      ok: false,
      status: 503,
      error:
        'SECUREYE_WEBHOOK_SECRET is not configured in Google Secret Manager. Run: firebase functions:secrets:set SECUREYE_WEBHOOK_SECRET',
    };
  }

  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const providedSecret =
    req.headers['x-webhook-secret'] ||
    req.headers['x-secureye-secret'] ||
    bearerToken;

  if (!safeEqual(providedSecret, configuredSecret)) {
    await writeSyncLog({
      level: 'error',
      eventType: 'auth_error',
      message: 'Rejected unauthenticated biometric cloud webhook request',
      details: `Path: ${req.path}, IP: ${req.ip || 'unknown'}`,
    });
    return { ok: false, status: 401, error: 'Invalid or missing webhook secret.' };
  }

  return { ok: true };
}

/**
 * Parse GymPro member expiry dates in ISO (YYYY-MM-DD) or display format ("24 Dec 2026").
 */
function parseExpiryDate(rawDate) {
  if (!rawDate) return null;
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(23, 59, 59, 999);
  return parsed;
}

/**
 * Validate gym subscription status and expiry date against punch timestamp.
 */
function evaluateMembershipAccess(memberData, now = new Date()) {
  if (!memberData) {
    return { granted: false, reason: 'Biometric User ID is not linked to any gym member.' };
  }

  if (memberData.status === 'inactive') {
    return { granted: false, reason: 'Membership account is inactive / suspended.' };
  }

  if (memberData.status === 'expired') {
    return {
      granted: false,
      reason: `Membership expired${memberData.expiryDate ? ` on ${memberData.expiryDate}` : ''}.`,
    };
  }

  const expiry = parseExpiryDate(memberData.expiryDate);
  if (expiry && expiry.getTime() < now.getTime()) {
    return {
      granted: false,
      reason: `Membership expired on ${memberData.expiryDate}.`,
    };
  }

  if (memberData.status === 'pending') {
    return { granted: false, reason: 'Membership payment is pending activation.' };
  }

  return { granted: true, reason: 'Active membership verified via Secureye Cloud biometric scan.' };
}

/**
 * Build deterministic event deduplication key (deviceSn + biometricUserId + second-level timestamp).
 */
function buildEventKey(deviceSn, biometricUserId, punchTimeIso) {
  const dateObj = new Date(punchTimeIso);
  const normalizedTime = Number.isNaN(dateObj.getTime())
    ? String(punchTimeIso).trim()
    : dateObj.toISOString().slice(0, 19);
  const raw = `${String(deviceSn).trim().toUpperCase()}|${String(biometricUserId).trim()}|${normalizedTime}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Process a single real attendance event from Secureye Cloud, enforce deduplication,
 * match biometricUserId -> Gym Member ID, validate membership expiry, and write to Firestore.
 */
async function processCloudAttendanceEvent(evt) {
  const deviceId = evt.deviceId ? String(evt.deviceId).trim() : null;
  const deviceSn = String(evt.deviceSn || '').trim();
  const biometricUserId = String(evt.biometricUserId ?? '').trim();
  const rawPunchTime = evt.punchTime || new Date().toISOString();
  const verifyMode = evt.verifyMode || 'fingerprint';

  if (!deviceSn || !biometricUserId) {
    return {
      ok: false,
      error: 'Missing required fields: deviceSn and biometricUserId are required.',
    };
  }

  const punchDate = new Date(rawPunchTime);
  const validPunchDate = Number.isNaN(punchDate.getTime()) ? new Date() : punchDate;
  const punchIso = validPunchDate.toISOString();
  const eventKey = buildEventKey(deviceSn, biometricUserId, punchIso);

  // 1. Atomic duplicate protection
  const dedupRef = db.collection('biometric_event_dedup').doc(eventKey);
  const isDuplicate = await db.runTransaction(async (tx) => {
    const existing = await tx.get(dedupRef);
    if (existing.exists) return true;
    tx.set(dedupRef, {
      deviceId,
      deviceSn,
      biometricUserId,
      punchTime: punchIso,
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return false;
  });

  if (isDuplicate) {
    await writeSyncLog({
      level: 'info',
      eventType: 'duplicate_blocked',
      deviceId,
      deviceSn,
      biometricUserId,
      message: `Duplicate cloud attendance event ignored for biometric user ${biometricUserId} at ${punchIso}`,
      details: `eventKey=${eventKey}`,
    });
    return { ok: true, duplicate: true, eventKey };
  }

  // 2. Match Biometric User ID -> Gym Member ID
  const membersRef = db.collection('members');
  let memberDoc = null;

  const byBiometricId = await membersRef
    .where('biometricId', '==', biometricUserId)
    .limit(1)
    .get();
  if (!byBiometricId.empty) {
    memberDoc = byBiometricId.docs[0];
  } else {
    const directDoc = await membersRef.doc(biometricUserId).get();
    if (directDoc.exists) {
      memberDoc = directDoc;
    }
  }

  const memberData = memberDoc ? memberDoc.data() : null;
  const verdict = evaluateMembershipAccess(memberData, validPunchDate);

  const checkInDate = punchIso.split('T')[0];
  const checkInTime = validPunchDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const terminalLabel = evt.deviceName
    ? `${evt.deviceName} (${deviceSn})`
    : `Secureye Cloud (${deviceSn})`;

  const attendanceId = `att-${eventKey.slice(0, 16)}`;
  const accessLogId = `log-${eventKey.slice(0, 16)}`;

  const attendanceRecord = {
    id: attendanceId,
    memberId: memberDoc ? memberDoc.id : `UNLINKED:${biometricUserId}`,
    memberName: memberData ? memberData.name : `Unlinked Biometric User (${biometricUserId})`,
    memberEmail: memberData?.email || null,
    avatar:
      memberData?.avatar ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    checkInDate,
    checkInTime,
    timestamp: `${checkInDate} ${checkInTime}`,
    method: 'biometric',
    verifyMode,
    status: verdict.granted ? 'granted' : 'denied',
    reason: verdict.reason,
    terminalId: terminalLabel,
    deviceId,
    deviceSn,
    biometricUserId,
    eventKey,
    source: 'secureye',
    rawPunchTime: punchIso,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const accessLogRecord = {
    id: accessLogId,
    memberId: attendanceRecord.memberId,
    memberName: attendanceRecord.memberName,
    avatar: attendanceRecord.avatar,
    time: checkInTime,
    status: attendanceRecord.status,
    reason: verdict.reason,
    terminalId: terminalLabel,
    deviceSn,
    biometricUserId,
    source: 'secureye',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const batch = db.batch();
  batch.set(db.collection('attendance').doc(attendanceId), attendanceRecord);
  batch.set(db.collection('access_logs').doc(accessLogId), accessLogRecord);

  if (memberDoc && verdict.granted) {
    batch.update(memberDoc.ref, {
      totalCheckIns: admin.firestore.FieldValue.increment(1),
      lastCheckIn: `${checkInDate} ${checkInTime}`,
      lastVisit: `${checkInDate} ${checkInTime}`,
    });
  }

  let targetDeviceRef = null;
  if (deviceId) {
    const devDoc = await db.collection('biometric_devices').doc(deviceId).get();
    if (devDoc.exists) targetDeviceRef = devDoc.ref;
  }
  if (!targetDeviceRef) {
    const devBySn = await db
      .collection('biometric_devices')
      .where('serialNumber', '==', deviceSn)
      .limit(1)
      .get();
    if (!devBySn.empty) targetDeviceRef = devBySn.docs[0].ref;
  }

  const nowIso = new Date().toISOString();
  if (targetDeviceRef) {
    batch.update(targetDeviceRef, {
      status: 'connected',
      authStatus: 'authenticated',
      lastSyncAt: punchIso,
      lastAttendanceAt: punchIso,
      lastCommunicationAt: nowIso,
      lastError: null,
      updatedAt: nowIso,
    });
  }

  await batch.commit();

  await writeSyncLog({
    level: verdict.granted ? 'success' : 'warning',
    eventType: 'attendance_sync',
    deviceId: targetDeviceRef?.id || deviceId,
    deviceSn,
    biometricUserId,
    memberId: memberDoc?.id || null,
    message: verdict.granted
      ? `Cloud attendance recorded for ${attendanceRecord.memberName} (${memberDoc.id})`
      : `Cloud scan denied for biometric user ${biometricUserId}: ${verdict.reason}`,
    details: `attendanceId=${attendanceId}, punchTime=${punchIso}, verifyMode=${verifyMode}`,
  });

  return {
    ok: true,
    duplicate: false,
    attendanceId,
    granted: verdict.granted,
    reason: verdict.reason,
    memberId: memberDoc?.id || null,
    memberName: attendanceRecord.memberName,
  };
}

/**
 * Direct Cloud Biometric HTTPS Cloud Function (/api/biometric/** via Firebase Hosting rewrite).
 * Zero local PC / zero local connector required.
 */
export const biometricApi = onRequest(
  {
    region: 'us-central1',
    cors: true,
    secrets: [SECUREYE_CLOUD_API_KEY, SECUREYE_WEBHOOK_SECRET],
    timeoutSeconds: 30,
  },
  async (req, res) => {
    const pathname = (req.path || '/').replace(/\/+$/, '') || '/';
    const method = req.method.toUpperCase();

    if (method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      // ------------------------------------------------------------------
      // 1. GET /api/biometric/health
      // ------------------------------------------------------------------
      if (method === 'GET' && pathname.endsWith('/health')) {
        let firestoreReachable = false;
        let firestoreError = null;
        try {
          await db.collection('biometric_devices').limit(1).get();
          firestoreReachable = true;
        } catch (err) {
          firestoreError = err.message;
        }

        const apiKeyConfigured = Boolean(
          process.env.SECUREYE_CLOUD_API_KEY || SECUREYE_CLOUD_API_KEY.value()
        );
        const webhookSecretConfigured = Boolean(
          process.env.SECUREYE_WEBHOOK_SECRET || SECUREYE_WEBHOOK_SECRET.value()
        );

        res.status(firestoreReachable ? 200 : 503).json({
          ok: firestoreReachable,
          mode: 'direct-cloud-only',
          backend: 'firebase-cloud-functions',
          projectId: process.env.GCLOUD_PROJECT || admin.app().options.projectId || 'gym001-50a97',
          firestoreReachable,
          firestoreError,
          secureyeApiKeyConfigured: apiKeyConfigured,
          webhookSecretConfigured,
          serverTime: new Date().toISOString(),
        });
        return;
      }

      // ------------------------------------------------------------------
      // 2. POST /api/biometric/devices (Register / Update Cloud Device)
      // ------------------------------------------------------------------
      if (method === 'POST' && pathname.endsWith('/devices')) {
        const authCheck = await verifyAdminRequest(req);
        if (!authCheck.ok) {
          res.status(authCheck.status).json({ ok: false, error: authCheck.error });
          return;
        }

        const body = req.body || {};
        const name = String(body.name || '').trim();
        const model = String(body.model || 'Unidentified — pending verification').trim();
        const serialNumber = String(body.serialNumber || '').trim();
        const connectionMethod =
          body.connectionMethod === 'secureye_cloud_webhook'
            ? 'secureye_cloud_webhook'
            : 'secureye_cloud_api';

        if (!name || !serialNumber) {
          res.status(400).json({
            ok: false,
            error: 'Device Name and Serial Number are required.',
          });
          return;
        }

        const deviceId =
          body.id ||
          `dev-${serialNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

        const nowIso = new Date().toISOString();
        const existingSnap = await db.collection('biometric_devices').doc(deviceId).get();
        const existing = existingSnap.exists ? existingSnap.data() : null;

        const hasNewPassword =
          typeof body.password === 'string' && body.password.trim().length > 0;

        // Device status always starts/resets to unverified until real cloud verification succeeds.
        const deviceDoc = {
          id: deviceId,
          name,
          manufacturer: 'Secureye',
          model,
          serialNumber,
          ipAddress: String(body.ipAddress || '').trim(),
          port: Number(body.port || 443),
          connectionMethod,
          protocolStatus: existing?.protocolStatus || 'unidentified',
          protocolType: existing?.protocolType || 'unverified',
          username: String(body.username || '').trim(),
          hasPassword: hasNewPassword ? true : Boolean(existing?.hasPassword),
          cloudConfig: {
            p2pCloudId: String(body.cloudConfig?.p2pCloudId || '').trim(),
            cloudApiUrl: String(body.cloudConfig?.cloudApiUrl || '').trim(),
            webhookPath: '/api/biometric/webhook',
            pushIntervalSec: Number(body.cloudConfig?.pushIntervalSec || 300),
          },
          status: 'unverified',
          authStatus: 'unverified',
          lastSyncAt: existing?.lastSyncAt || null,
          lastCommunicationAt: existing?.lastCommunicationAt || null,
          lastAttendanceAt: existing?.lastAttendanceAt || null,
          lastError: null,
          registeredUsersCount: Number(existing?.registeredUsersCount || 0),
          createdAt: existing?.createdAt || nowIso,
          updatedAt: nowIso,
          updatedBy: authCheck.user.email || authCheck.user.uid,
        };

        await db.collection('biometric_devices').doc(deviceId).set(deviceDoc, { merge: true });

        if (hasNewPassword) {
          await db.collection('biometric_device_secrets').doc(deviceId).set(
            {
              deviceId,
              username: deviceDoc.username,
              password: body.password.trim(),
              updatedAt: nowIso,
              updatedBy: authCheck.user.uid,
            },
            { merge: true }
          );
        }

        await writeSyncLog({
          level: 'info',
          eventType: 'device_config',
          deviceId,
          deviceSn: serialNumber,
          message: `Registered/updated Secureye cloud device "${name}" (${connectionMethod}) — awaiting official cloud API/webhook verification.`,
          details: `Model=${model}, P2P ID=${deviceDoc.cloudConfig.p2pCloudId || 'n/a'}`,
        });

        res.status(200).json({ ok: true, device: deviceDoc });
        return;
      }

      // ------------------------------------------------------------------
      // 3. DELETE /api/biometric/devices/:id
      // ------------------------------------------------------------------
      if (method === 'DELETE' && pathname.includes('/devices/')) {
        const authCheck = await verifyAdminRequest(req);
        if (!authCheck.ok) {
          res.status(authCheck.status).json({ ok: false, error: authCheck.error });
          return;
        }

        const deviceId = pathname.split('/devices/')[1]?.split('/')[0];
        if (!deviceId) {
          res.status(400).json({ ok: false, error: 'Missing device ID.' });
          return;
        }

        await Promise.all([
          db.collection('biometric_devices').doc(deviceId).delete(),
          db.collection('biometric_device_secrets').doc(deviceId).delete(),
        ]);

        await writeSyncLog({
          level: 'info',
          eventType: 'device_config',
          deviceId,
          message: `Removed Secureye cloud device ${deviceId} and server-side credentials.`,
        });

        res.status(200).json({ ok: true, deletedId: deviceId });
        return;
      }

      // ------------------------------------------------------------------
      // 4. POST /api/biometric/test-connection (Direct Cloud Test Only)
      // ------------------------------------------------------------------
      if (method === 'POST' && pathname.endsWith('/test-connection')) {
        const authCheck = await verifyAdminRequest(req);
        if (!authCheck.ok) {
          res.status(authCheck.status).json({ ok: false, error: authCheck.error });
          return;
        }

        const { deviceId } = req.body || {};
        if (!deviceId) {
          res.status(400).json({ ok: false, error: 'deviceId is required.' });
          return;
        }

        const deviceRef = db.collection('biometric_devices').doc(String(deviceId));
        const deviceSnap = await deviceRef.get();
        if (!deviceSnap.exists) {
          res.status(404).json({ ok: false, error: `Device ${deviceId} not found.` });
          return;
        }

        const device = deviceSnap.data();
        const nowIso = new Date().toISOString();
        const cloudApiUrl = device.cloudConfig?.cloudApiUrl?.trim();

        // Case A: Official Secureye Cloud API URL was supplied by the user — run real HTTP probe
        if (cloudApiUrl) {
          try {
            const secretSnap = await db
              .collection('biometric_device_secrets')
              .doc(device.id)
              .get();
            const secretData = secretSnap.exists ? secretSnap.data() : null;
            const apiKey =
              process.env.SECUREYE_CLOUD_API_KEY || SECUREYE_CLOUD_API_KEY.value();

            const headers = { Accept: 'application/json, text/plain' };
            if (apiKey) {
              headers.Authorization = `Bearer ${apiKey}`;
            } else if (device.username && secretData?.password) {
              const basic = Buffer.from(
                `${device.username}:${secretData.password}`
              ).toString('base64');
              headers.Authorization = `Basic ${basic}`;
            }

            const probeResp = await fetch(cloudApiUrl, {
              method: 'GET',
              headers,
              signal: AbortSignal.timeout(8000),
            });

            const reachable = probeResp.ok;
            const authFailed = probeResp.status === 401 || probeResp.status === 403;
            const connected = reachable && device.protocolStatus === 'verified';
            const reason = connected
              ? `Official Secureye Cloud API responded HTTP ${probeResp.status} and protocol is verified.`
              : reachable
              ? `Endpoint responded HTTP ${probeResp.status}, but Secureye attendance API schema is not yet verified — device remains Unverified until attendance payload parsing is implemented.`
              : `Secureye Cloud API returned HTTP ${probeResp.status} ${probeResp.statusText}.`;

            await deviceRef.update({
              status: connected ? 'connected' : authFailed ? 'auth_failed' : 'disconnected',
              authStatus: authFailed ? 'failed' : connected ? 'authenticated' : 'unverified',
              lastCommunicationAt: reachable ? nowIso : device.lastCommunicationAt || null,
              lastError: connected ? null : reason,
              updatedAt: nowIso,
            });

            await writeSyncLog({
              level: connected ? 'success' : 'warning',
              eventType: 'connection_test',
              deviceId: device.id,
              deviceSn: device.serialNumber,
              message: reason,
              details: `URL=${cloudApiUrl}, HTTP=${probeResp.status}`,
            });

            res.status(200).json({
              ok: true,
              connected,
              reachable,
              authenticated: connected,
              httpStatus: probeResp.status,
              reason,
              testedAt: nowIso,
            });
            return;
          } catch (err) {
            const reason = `Cloud API request failed: ${err.message}`;
            await deviceRef.update({
              status: 'error',
              authStatus: 'unverified',
              lastError: reason,
              updatedAt: nowIso,
            });
            await writeSyncLog({
              level: 'error',
              eventType: 'connection_test',
              deviceId: device.id,
              deviceSn: device.serialNumber,
              message: reason,
              details: `URL=${cloudApiUrl}`,
            });
            res.status(200).json({
              ok: true,
              connected: false,
              reachable: false,
              authenticated: false,
              reason,
              testedAt: nowIso,
            });
            return;
          }
        }

        // Case B: Webhook / direct cloud push mode — check for a genuine recent cloud event
        const lastCommMs = device.lastCommunicationAt
          ? new Date(device.lastCommunicationAt).getTime()
          : 0;
        const recentEvent =
          lastCommMs > 0 && Date.now() - lastCommMs <= CLOUD_HEARTBEAT_WINDOW_MS;
        const connected = recentEvent && device.protocolStatus === 'verified';

        const reason = connected
          ? `Device ${device.serialNumber} delivered a verified cloud event within the last 5 minutes.`
          : 'Official Secureye Cloud / P2P API endpoint is not configured and no verified webhook event has been received. Secureye does not publish a public P2P Cloud API — obtain official ONtime Cloud API docs/credentials from Secureye or confirm whether your device supports a custom Cloud Push Server URL.';

        await deviceRef.update({
          status: connected ? 'connected' : 'disconnected',
          authStatus: connected ? 'authenticated' : 'unverified',
          lastError: connected ? null : reason,
          updatedAt: nowIso,
        });

        await writeSyncLog({
          level: connected ? 'success' : 'warning',
          eventType: 'connection_test',
          deviceId: device.id,
          deviceSn: device.serialNumber,
          message: reason,
        });

        res.status(200).json({
          ok: true,
          connected,
          reachable: recentEvent,
          authenticated: connected,
          reason,
          testedAt: nowIso,
        });
        return;
      }

      // ------------------------------------------------------------------
      // 5. POST /api/biometric/webhook (Authenticated Real-Time Webhook)
      // ------------------------------------------------------------------
      if (method === 'POST' && (pathname.endsWith('/webhook') || pathname.endsWith('/events'))) {
        const secretCheck = await verifyWebhookSecret(req);
        if (!secretCheck.ok) {
          res.status(secretCheck.status).json({ ok: false, error: secretCheck.error });
          return;
        }

        const payload = req.body || {};
        const events = Array.isArray(payload.events) ? payload.events : [payload];
        const results = [];

        for (const evt of events) {
          results.push(await processCloudAttendanceEvent(evt));
        }

        res.status(200).json({
          ok: true,
          processed: results.length,
          results,
        });
        return;
      }

      res
        .status(404)
        .json({ ok: false, error: `Unknown biometric cloud API route: ${method} ${pathname}` });
    } catch (err) {
      console.error('[biometricApi] Unhandled error:', err);
      await writeSyncLog({
        level: 'error',
        eventType: 'attendance_sync',
        message: `Backend error on ${method} ${pathname}: ${err.message}`,
      });
      res.status(500).json({ ok: false, error: err.message });
    }
  }
);

/**
 * Scheduled Cloud Synchronization (runs every 5 minutes via Cloud Scheduler).
 * Will only poll Secureye Cloud once an official verified Secureye Cloud API specification
 * and Google Secret Manager API key are provided. Never invents endpoints or fakes punches.
 */
export const syncSecureyeCloudAttendance = onSchedule(
  {
    schedule: 'every 5 minutes',
    region: 'us-central1',
    secrets: [SECUREYE_CLOUD_API_KEY],
  },
  async () => {
    const devicesSnap = await db
      .collection('biometric_devices')
      .where('connectionMethod', '==', 'secureye_cloud_api')
      .get();

    if (devicesSnap.empty) return;

    const apiKey =
      process.env.SECUREYE_CLOUD_API_KEY || SECUREYE_CLOUD_API_KEY.value();

    for (const devDoc of devicesSnap.docs) {
      const device = devDoc.data();
      if (device.protocolStatus !== 'verified' || !device.cloudConfig?.cloudApiUrl) {
        await writeSyncLog({
          level: 'warning',
          eventType: 'protocol_mismatch',
          deviceId: devDoc.id,
          deviceSn: device.serialNumber,
          message:
            'Scheduled cloud sync skipped: official Secureye Cloud API endpoint and payload specification have not been verified yet.',
        });
        continue;
      }

      if (!apiKey) {
        await writeSyncLog({
          level: 'error',
          eventType: 'auth_error',
          deviceId: devDoc.id,
          deviceSn: device.serialNumber,
          message:
            'Scheduled cloud sync skipped: SECUREYE_CLOUD_API_KEY is not set in Google Secret Manager.',
        });
      }
      // Official Secureye Cloud API polling implementation will be added here ONLY once
      // Secureye's official API documentation, endpoint path, and response schema are verified.
    }
  }
);
