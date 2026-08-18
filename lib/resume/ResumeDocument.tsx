import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ApplicantProfileDoc } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  name: { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  contact: { fontSize: 9, color: "#555555", marginBottom: 16 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  entry: { marginBottom: 8 },
  entryTitleRow: { flexDirection: "row", justifyContent: "space-between" },
  entryTitle: { fontSize: 10, fontWeight: 700 },
  entryDates: { fontSize: 9, color: "#555555" },
  entrySubtitle: { fontSize: 9.5, marginBottom: 2 },
  entryDescription: { fontSize: 9.5, color: "#333333" },
  skillsRow: { flexDirection: "row", flexWrap: "wrap" },
  skillChip: {
    fontSize: 9,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginRight: 4,
    marginBottom: 4,
  },
});

function dateRange(start: string, end: string | null, current: boolean): string {
  const endLabel = current ? "Present" : (end ?? "");
  return [start, endLabel].filter(Boolean).join(" – ");
}

export function ResumeDocument({ profile }: { profile: ApplicantProfileDoc }) {
  const { basicInfo, experience, education, skills } = profile;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{basicInfo.name}</Text>
        <Text style={styles.contact}>
          {[basicInfo.location, basicInfo.phone].filter(Boolean).join("  ·  ")}
        </Text>

        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((entry, i) => (
              <View key={i} style={styles.entry}>
                <View style={styles.entryTitleRow}>
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                  <Text style={styles.entryDates}>{dateRange(entry.startDate, entry.endDate, entry.current)}</Text>
                </View>
                <Text style={styles.entrySubtitle}>{entry.company}</Text>
                {entry.description && <Text style={styles.entryDescription}>{entry.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((entry, i) => (
              <View key={i} style={styles.entry}>
                <View style={styles.entryTitleRow}>
                  <Text style={styles.entryTitle}>{entry.school}</Text>
                  <Text style={styles.entryDates}>{dateRange(entry.startDate, entry.endDate, false)}</Text>
                </View>
                <Text style={styles.entrySubtitle}>
                  {[entry.degree, entry.field].filter(Boolean).join(", ")}
                </Text>
              </View>
            ))}
          </View>
        )}

        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsRow}>
              {skills.map((skill) => (
                <Text key={skill} style={styles.skillChip}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
