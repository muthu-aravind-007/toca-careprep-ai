export const patients = [
  {
    id: "pt-1042", name: "Sarah Johnson", initials: "SJ", age: 62, gender: "Female", status: "Needs review",
    program: "Remote patient monitoring", clinician: "Care Team North", lastContact: "Nov 14, 2026",
    conditions: ["Hypertension", "Type 2 diabetes"],
    vitals: [
      { label: "Blood pressure", value: "148/92 mmHg", previous: "132/84 mmHg", date: "Nov 17, 2026", numeric: 148 },
      { label: "Heart rate", value: "78 bpm", previous: "76 bpm", date: "Nov 17, 2026", numeric: 78 },
      { label: "Blood glucose", value: "142 mg/dL", previous: "136 mg/dL", date: "Nov 17, 2026", numeric: 142 }
    ],
    missedReadings: 2,
    medications: [{ name: "Lisinopril", detail: "Medication list updated 5 days ago; confirm current dose and schedule with patient." }, { name: "Metformin", detail: "Listed in the sample medication record; confirm current use." }],
    notes: [
      { date: "Nov 14, 2026", title: "Care manager check-in", text: "Patient mentioned difficulty maintaining a consistent medication schedule." },
      { date: "Nov 10, 2026", title: "Monitoring follow-up", text: "Reviewed home monitoring routine. Patient had questions about submitting readings." },
      { date: "Nov 05, 2026", title: "Routine outreach", text: "Patient reports continuing home monitoring." }
    ],
    trend: [{ day: "Nov 11", bp: 132 }, { day: "Nov 12", bp: 134 }, { day: "Nov 13", bp: 136 }, { day: "Nov 14", bp: 139 }, { day: "Nov 15", bp: 141 }, { day: "Nov 16", bp: 145 }, { day: "Nov 17", bp: 148 }]
  },
  {
    id: "pt-1088", name: "Michael Chen", initials: "MC", age: 57, gender: "Male", status: "On track",
    program: "Chronic care management", clinician: "Care Team West", lastContact: "Nov 16, 2026",
    conditions: ["Type 2 diabetes"],
    vitals: [
      { label: "Blood pressure", value: "126/80 mmHg", previous: "128/82 mmHg", date: "Nov 17, 2026" },
      { label: "Heart rate", value: "72 bpm", previous: "74 bpm", date: "Nov 17, 2026" },
      { label: "Blood glucose", value: "118 mg/dL", previous: "121 mg/dL", date: "Nov 17, 2026" }
    ],
    missedReadings: 0,
    medications: [{ name: "Metformin", detail: "No medication changes recorded in the supplied sample." }],
    notes: [
      { date: "Nov 16, 2026", title: "Weekly check-in", text: "Patient reports no issues with monitoring routine." },
      { date: "Nov 09, 2026", title: "Care note", text: "Discussed keeping a consistent daily log." }
    ],
    trend: [{ day: "Nov 11", bp: 130 }, { day: "Nov 12", bp: 129 }, { day: "Nov 13", bp: 128 }, { day: "Nov 14", bp: 127 }, { day: "Nov 15", bp: 127 }, { day: "Nov 16", bp: 128 }, { day: "Nov 17", bp: 126 }]
  },
  {
    id: "pt-1120", name: "Elena Rodriguez", initials: "ER", age: 71, gender: "Female", status: "Follow-up",
    program: "Remote patient monitoring", clinician: "Care Team South", lastContact: "Nov 12, 2026",
    conditions: ["Heart failure", "Hypertension"],
    vitals: [
      { label: "Blood pressure", value: "138/86 mmHg", previous: "136/84 mmHg", date: "Nov 17, 2026" },
      { label: "Heart rate", value: "82 bpm", previous: "80 bpm", date: "Nov 17, 2026" },
      { label: "Weight", value: "72.4 kg", previous: "71.8 kg", date: "Nov 17, 2026" }
    ],
    missedReadings: 1,
    medications: [{ name: "Medication reconciliation", detail: "Patient-reported list requires confirmation during next contact." }],
    notes: [
      { date: "Nov 12, 2026", title: "Patient outreach", text: "Patient requested a follow-up call to review home monitoring." },
      { date: "Nov 08, 2026", title: "Monitoring note", text: "One scheduled weight reading not received." }
    ],
    trend: [{ day: "Nov 11", bp: 132 }, { day: "Nov 12", bp: 133 }, { day: "Nov 13", bp: 134 }, { day: "Nov 14", bp: 135 }, { day: "Nov 15", bp: 136 }, { day: "Nov 16", bp: 137 }, { day: "Nov 17", bp: 138 }]
  }
];