/**
 * Optional real-time mirror from the ADMS HTTP Push Server into the existing
 * GymPro Firebase Cloud Firestore database (project: gym001-50a97).
 *
 * Activated automatically when FIREBASE_SERVICE_ACCOUNT_JSON or
 * FIREBASE_SERVICE_ACCOUNT_PATH is provided.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

let firestoreDb = null;

export function initFirebaseSync() {
  const inlineJson = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
  const keyPath = (process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '').trim();

  let serviceAccount = null;

  try {
    if (inlineJson) {
      serviceAccount = JSON.parse(
        inlineJson.startsWith('{')
          ? inlineJson
          : Buffer.from(inlineJson, 'base64').toString('utf8')
      );
    } else if (keyPath && fs.existsSync(path.resolve(keyPath))) {
      serviceAccount = JSON.parse(fs.readFileSync(path.resolve(keyPath), 'utf8'));
    }
  } catch (err) {
    console.error('[FirebaseSync] Failed to load Firebase service account:', err.message);
    return false;
  }

  if (!serviceAccount) {
    console.log(
      '[FirebaseSync] Disabled (set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON to mirror punches into GymPro Firestore).'
    );
    return false;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id || 'gym001-50a97',
    });
  }

  firestoreDb = admin.firestore();
  console.log(
    `[FirebaseSync] Enabled for Firebase project "${process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id}".`
  );
  return true;
}

export function isFirebaseSyncEnabled() {
  return Boolean(firestoreDb);
}

function parseExpiryDate(rawDate) {
  if (!rawDate) return null;
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}

function evaluateMembership(memberData, punchDate) {
  if (!memberData) {
    return { granted: false, reason: 'Biometric User ID not linked to any GymPro member.' };
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
  if (expiry && expiry.getTime() < punchDate.getTime()) {
    return { granted: false, reason: `Membership expired on ${memberData.expiryDate}.` };
  }
  if (memberData.status === 'pending') {
    return { granted: false, reason: 'Membership payment pending activation.' };
  }
  return { granted: true, reason: 'Active membership verified via ADMS biometric punch.' };
}

export async function syncDeviceHeartbeatToFirestore({ serialNumber, ipAddress }) {
  if (!firestoreDb || !serialNumber) return;
  try {
    const nowIso = new Date().toISOString();
    const snap = await firestoreDb
      .collection('biometric_devices')
      .where('serialNumber', '==', serialNumber)
      .limit(1)
      .get();

    if (!snap.empty) {
      await snap.docs[0].ref.update({
        status: 'connected',
        authStatus: 'authenticated',
        protocolStatus: 'verified',
        protocolType: 'zkteco_adms',
        ipAddress: ipAddress || snap.docs[0].data().ipAddress || '',
        lastCommunicationAt: nowIso,
        lastError: null,
        updatedAt: nowIso,
      });
    }
  } catch (err) {
    console.error('[FirebaseSync] Heartbeat mirror error:', err.message);
  }
}

export async function syncPunchToFirestore({
  deviceSn,
  employeeCode,
  punchTime,
  verifyModeLabel,
}) {
  if (!firestoreDb) return null;

  try {
    const punchDate = new Date(punchTime);
    const eventKey = crypto
      .createHash('sha256')
      .update(`${deviceSn.toUpperCase()}|${employeeCode}|${punchTime.slice(0, 19)}`)
      .digest('hex');

    const membersRef = firestoreDb.collection('members');
    let memberDoc = null;

    const byBio = await membersRef.where('biometricId', '==', employeeCode).limit(1).get();
    if (!byBio.empty) {
      memberDoc = byBio.docs[0];
    } else {
      const direct = await membersRef.doc(employeeCode).get();
      if (direct.exists) memberDoc = direct;
    }

    const memberData = memberDoc ? memberDoc.data() : null;
    const verdict = evaluateMembership(memberData, punchDate);

    const checkInDate = punchTime.split('T')[0];
    const checkInTime = punchDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const attendanceId = `att-${eventKey.slice(0, 16)}`;
    const accessLogId = `log-${eventKey.slice(0, 16)}`;
    const terminalId = `Secureye ADMS (${deviceSn})`;

    const batch = firestoreDb.batch();
    batch.set(firestoreDb.collection('attendance').doc(attendanceId), {
      id: attendanceId,
      memberId: memberDoc ? memberDoc.id : `UNLINKED:${employeeCode}`,
      memberName: memberData ? memberData.name : `Unlinked User (${employeeCode})`,
      memberEmail: memberData?.email || null,
      avatar:
        memberData?.avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      checkInDate,
      checkInTime,
      timestamp: `${checkInDate} ${checkInTime}`,
      method: 'biometric',
      verifyMode: verifyModeLabel,
      status: verdict.granted ? 'granted' : 'denied',
      reason: verdict.reason,
      terminalId,
      deviceSn,
      biometricUserId: employeeCode,
      eventKey,
      source: 'secureye',
      rawPunchTime: punchTime,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    batch.set(firestoreDb.collection('access_logs').doc(accessLogId), {
      id: accessLogId,
      memberId: memberDoc ? memberDoc.id : `UNLINKED:${employeeCode}`,
      memberName: memberData ? memberData.name : `Unlinked User (${employeeCode})`,
      avatar:
        memberData?.avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      time: checkInTime,
      status: verdict.granted ? 'granted' : 'denied',
      reason: verdict.reason,
      terminalId,
      deviceSn,
      biometricUserId: employeeCode,
      source: 'secureye',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (memberDoc && verdict.granted) {
      batch.update(memberDoc.ref, {
        totalCheckIns: admin.firestore.FieldValue.increment(1),
        lastCheckIn: `${checkInDate} ${checkInTime}`,
        lastVisit: `${checkInDate} ${checkInTime}`,
      });
    }

    const devSnap = await firestoreDb
      .collection('biometric_devices')
      .where('serialNumber', '==', deviceSn)
      .limit(1)
      .get();
    const nowIso = new Date().toISOString();
    if (!devSnap.empty) {
      batch.update(devSnap.docs[0].ref, {
        status: 'connected',
        authStatus: 'authenticated',
        protocolStatus: 'verified',
        protocolType: 'zkteco_adms',
        lastSyncAt: punchTime,
        lastAttendanceAt: punchTime,
        lastCommunicationAt: nowIso,
        lastError: null,
        updatedAt: nowIso,
      });
    }

    await batch.commit();

    await firestoreDb.collection('biometric_sync_logs').add({
      timestamp: nowIso,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      level: verdict.granted ? 'success' : 'warning',
      eventType: 'attendance_sync',
      deviceSn,
      biometricUserId: employeeCode,
      memberId: memberDoc?.id || null,
      message: verdict.granted
        ? `ADMS punch recorded for ${memberData.name} (${memberDoc.id})`
        : `ADMS punch denied for User ${employeeCode}: ${verdict.reason}`,
      details: `attendanceId=${attendanceId}, verifyMode=${verifyModeLabel}`,
    });

    return { attendanceId, granted: verdict.granted };
  } catch (err) {
    console.error('[FirebaseSync] Failed to mirror punch to Firestore:', err.message);
    return null;
  }
}
