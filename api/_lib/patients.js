const bp = (d, sys, dia) => ({ date: `2026-11-${d}`, sys, dia });

export const PATIENTS = {
  "PT-1042": {
    id: "PT-1042", name: "Sarah Johnson", age: 62, sex: "Female",
    conditions: ["Hypertension", "Type 2 diabetes"], asOf: "2026-11-17",
    bpReadings: [bp(11,132,84), bp(12,134,85), bp(13,136,86), bp(14,139,88), bp(15,141,89), bp(16,145,91), bp(17,148,92)],
    heartRate: { latest: 78, previous: 76 },
    glucose: { latest: 142, previous: 136 },
    missedReadings: [
      { date: "2026-11-14", type: "evening blood pressure" },
      { date: "2026-11-16", type: "evening blood pressure" },
    ],
    medication: { updatedDate: "2026-11-12", change: "antihypertensive entry updated in medication list", patientConfirmed: false },
    notes: [
      { date: "2026-11-14", title: "Care manager check-in", text: "Patient mentioned difficulty maintaining a consistent medication schedule." },
      { date: "2026-11-10", title: "Monitoring follow-up", text: "Reviewed home monitoring routine. Patient had questions about submitting readings." },
    ],
  },
  "PT-1043": {
    id: "PT-1043", name: "Michael Chen", age: 58, sex: "Male",
    conditions: ["Hypertension"], asOf: "2026-11-17",
    bpReadings: [bp(11,124,78), bp(12,126,79), bp(13,123,77), bp(14,125,78), bp(15,124,80), bp(16,126,78), bp(17,125,79)],
    heartRate: { latest: 68, previous: 70 },
    glucose: { latest: 98, previous: 101 },
    missedReadings: [],
    medication: { updatedDate: null, change: null, patientConfirmed: true },
    notes: [{ date: "2026-11-12", title: "Routine check-in", text: "Patient reports taking medication as scheduled and no concerns." }],
  },
  "PT-1044": {
    id: "PT-1044", name: "Elena Rodriguez", age: 67, sex: "Female",
    conditions: ["Type 2 diabetes"], asOf: "2026-11-17",
    bpReadings: [bp(11,128,82), bp(12,127,81), bp(13,129,82), bp(14,128,83), bp(15,130,82), bp(16,128,81), bp(17,129,82)],
    heartRate: { latest: 74, previous: 73 },
    glucose: { latest: 171, previous: 158 },
    missedReadings: [
      { date: "2026-11-13", type: "morning glucose" },
      { date: "2026-11-15", type: "morning glucose" },
      { date: "2026-11-16", type: "morning glucose" },
    ],
    medication: { updatedDate: null, change: null, patientConfirmed: true },
    notes: [{ date: "2026-11-13", title: "Device support", text: "Patient reported the glucose meter app was not syncing readings." }],
  },
};