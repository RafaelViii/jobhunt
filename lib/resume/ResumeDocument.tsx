import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ApplicantProfileDoc } from "@/lib/types";

const INK = "#1f2937";
const MUTED = "#6b7280";
const RULE = "#d1d5db";
const FOOTER = "#4b5563";

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingHorizontal: 40, paddingBottom: 28, fontSize: 10, fontFamily: "Helvetica", color: INK },
  name: { fontSize: 24, fontWeight: 700, textAlign: "center", letterSpacing: 1 },
  headline: { fontSize: 12, color: MUTED, textAlign: "center", marginTop: 4, marginBottom: 12 },
  contactRow: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", fontSize: 9.5, color: MUTED, marginBottom: 10 },
  contactItem: { marginHorizontal: 8 },
  rule: { borderBottomWidth: 1, borderBottomColor: RULE, marginBottom: 14 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11.5, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5 },
  aboutText: { fontSize: 9.5, lineHeight: 1.5, color: "#374151" },
  entry: { marginBottom: 10 },
  entryMeta: { fontSize: 9, color: MUTED, marginBottom: 2 },
  entryTitleRow: { flexDirection: "row", justifyContent: "space-between" },
  entryTitle: { fontSize: 10, fontWeight: 700 },
  entryDates: { fontSize: 9, color: MUTED },
  entryDescription: { fontSize: 9.5, color: "#374151", marginTop: 2, lineHeight: 1.4 },
  skillsGrid: { flexDirection: "row", flexWrap: "wrap" },
  skillItem: { width: "33%", fontSize: 9.5, marginBottom: 5, color: "#374151" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, height: 12, backgroundColor: FOOTER },
});

function dateRange(start: string, end: string | null, current: boolean): string {
  const endLabel = current ? "Present" : (end ?? "");
  return [start, endLabel].filter(Boolean).join(" – ");
}

export function ResumeDocument({ profile, email }: { profile: ApplicantProfileDoc; email: string }) {
  const { basicInfo, experience, education, skills, preferences } = profile;
  const headline = preferences.titles[0] ?? experience[0]?.title ?? "";
  const contactItems = [basicInfo.phone, email, basicInfo.address || basicInfo.location].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{basicInfo.name.toUpperCase()}</Text>
        {headline && <Text style={styles.headline}>{headline}</Text>}

        {contactItems.length > 0 && (
          <View style={styles.contactRow}>
            {contactItems.map((item, i) => (
              <Text key={i} style={styles.contactItem}>
                {item}
              </Text>
            ))}
          </View>
        )}
        <View style={styles.rule} />

        {basicInfo.about && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.aboutText}>{basicInfo.about}</Text>
            <View style={{ ...styles.rule, marginTop: 14, marginBottom: 0 }} />
          </View>
        )}

        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((entry, i) => (
              <View key={i} style={styles.entry}>
                <Text style={styles.entryMeta}>
                  {entry.school} | {dateRange(entry.startDate, entry.endDate, false)}
                </Text>
                <Text style={styles.entryTitle}>{[entry.degree, entry.field].filter(Boolean).join(", ")}</Text>
              </View>
            ))}
            <View style={{ ...styles.rule, marginTop: 4, marginBottom: 0 }} />
          </View>
        )}

        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {experience.map((entry, i) => (
              <View key={i} style={styles.entry}>
                <View style={styles.entryTitleRow}>
                  <Text style={styles.entryMeta}>{entry.company}</Text>
                  <Text style={styles.entryDates}>{dateRange(entry.startDate, entry.endDate, entry.current)}</Text>
                </View>
                <Text style={styles.entryTitle}>{entry.title}</Text>
                {entry.description && <Text style={styles.entryDescription}>{entry.description}</Text>}
              </View>
            ))}
            <View style={{ ...styles.rule, marginTop: 4, marginBottom: 0 }} />
          </View>
        )}

        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsGrid}>
              {skills.map((skill) => (
                <Text key={skill} style={styles.skillItem}>
                  •  {skill}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer} fixed />
      </Page>
    </Document>
  );
}
