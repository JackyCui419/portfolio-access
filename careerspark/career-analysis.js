const skillCatalog = [
    "SQL",
    "Python",
    "Excel",
    "Tableau",
    "Power BI",
    "React",
    "TypeScript",
    "JavaScript",
    "Node",
    "AWS",
    "Docker",
    "Kubernetes",
    "Machine Learning",
    "Data Analysis",
    "Communication",
    "Stakeholder Management",
    "Marketing",
    "SEO",
    "Figma",
    "UX",
    "Finance",
    "Modeling",
];
function includes(text, value) {
    return text.toLowerCase().includes(value.toLowerCase());
}
function pickSkills(text) {
    const found = skillCatalog.filter((skill) => includes(text, skill));
    return found.length ? found : ["Communication", "Problem Solving", "Data Analysis"];
}
function findLine(text, patterns) {
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    return lines.find((line) => patterns.some((pattern) => pattern.test(line))) ?? "";
}
export function analyzeJobDescription(jdText) {
    const text = jdText.trim();
    const lower = text.toLowerCase();
    const keySkills = pickSkills(text);
    const titleLine = findLine(text, [
        /engineer/i,
        /analyst/i,
        /intern/i,
        /manager/i,
        /designer/i,
        /consultant/i,
    ]);
    const companyLine = findLine(text, [/company/i, /about us/i, /inc\.?/i, /ltd\.?/i]);
    const remote = /remote|hybrid/i.test(text);
    const visa = /visa|sponsor|opt|cpt|work authorization/i.test(text);
    const internship = /intern|student|graduate|entry[- ]level/i.test(text);
    const salaryMatch = text.match(/[$£€][\d,]+(?:\s?[-–]\s?[$£€]?[\d,]+)?(?:k|K)?/);
    return {
        title: titleLine || (internship ? "Early-Career Target Role" : "Target Role"),
        company: companyLine || "Target Company",
        tags: [
            visa ? "Visa Sponsorship Signal" : "Work Authorization Review",
            remote ? "Remote/Hybrid" : "On-site/Unspecified",
            internship ? "Student Friendly" : "Experienced Role",
        ],
        level: internship
            ? "Entry Level / Internship"
            : /senior|lead|principal/i.test(text)
                ? "Senior"
                : "Mid-Level or Unspecified",
        location: remote
            ? "Remote or Hybrid mentioned"
            : findLine(text, [/location/i, /based in/i]) || "Location not clearly stated",
        salary: salaryMatch?.[0] ?? "Not stated",
        type: internship
            ? "Internship / Graduate"
            : /part[- ]time/i.test(lower)
                ? "Part-time"
                : "Full-time or Unspecified",
        fitScores: [
            { label: "Skills Clarity", value: Math.min(92, 52 + keySkills.length * 8) },
            { label: "Student Fit", value: internship ? 86 : 62 },
            { label: "Application Focus", value: visa || remote ? 80 : 70 },
        ],
        requirements: [
            `Highlight evidence for ${keySkills.slice(0, 4).join(", ")}.`,
            "Use project or work bullets with measurable outcomes.",
            visa
                ? "Prepare a clear work authorization explanation."
                : "Check work authorization wording before applying.",
            "Mirror important role keywords naturally in the resume.",
        ],
        hiddenCues: [
            {
                type: visa ? "sponsorship" : "warning",
                title: visa ? "Work Authorization Language Detected" : "Work Authorization Not Clear",
                description: visa
                    ? "The JD includes visa or authorization language, so international applicants should address timing clearly."
                    : "The JD does not clearly mention sponsorship. Confirm eligibility before investing heavy effort.",
            },
            {
                type: "insight",
                title: "Keyword-Driven Screening",
                description: `The strongest resume match should emphasize ${keySkills.slice(0, 3).join(", ")}.`,
            },
            {
                type: "warning",
                title: "Communication Bar",
                description: "Collaboration, stakeholder, or presentation cues usually mean interviewers will test clear communication.",
            },
        ],
        strategy: [
            {
                action: "Tailor the resume headline and skills section",
                tip: `Put ${keySkills.slice(0, 3).join(", ")} near the top if they are true strengths.`,
            },
            {
                action: "Rewrite bullets with outcomes",
                tip: "Use action + tool + impact, such as analyzed customer data with SQL to identify retention drivers.",
            },
            {
                action: "Prepare role-specific stories",
                tip: "Build two STAR examples that connect directly to the job's main responsibilities.",
            },
        ],
        keySkills,
        keywords: [...new Set([...keySkills, "collaboration", "analysis", "impact", "stakeholders"])],
    };
}
export function matchResumeToJob(resumeText, jdAnalysis) {
    const requiredSkills = jdAnalysis?.keySkills ?? [
        "Communication",
        "Problem Solving",
        "Data Analysis",
    ];
    const matchedSkills = requiredSkills.filter((skill) => includes(resumeText, skill));
    const missingSkills = requiredSkills.filter((skill) => !matchedSkills.includes(skill));
    const keywordScore = requiredSkills.length ? matchedSkills.length / requiredSkills.length : 0.4;
    const hasMetrics = /\d+%|\$\d+|\d+\s?(users|customers|records|projects|team|weeks|months)/i.test(resumeText);
    const score = Math.min(94, Math.max(42, Math.round(45 + keywordScore * 38 + (hasMetrics ? 11 : 0))));
    return {
        score,
        atsFriendly: score >= 68,
        format: resumeText.length > 800 ? "Detailed" : "Concise",
        summary: `This resume matches ${matchedSkills.length} of ${requiredSkills.length} priority skill areas from the JD.`,
        matchedSkills,
        missingSkills,
        keywords: missingSkills.length
            ? missingSkills
            : ["metrics", "impact", "stakeholder", "role-specific keywords"],
        suggestions: [
            {
                severity: missingSkills.length ? "critical" : "info",
                title: missingSkills.length ? "Add missing JD keywords" : "Keyword alignment is solid",
                description: missingSkills.length
                    ? `Add honest evidence for: ${missingSkills.join(", ")}.`
                    : "Keep these keywords tied to concrete projects or experience.",
            },
            {
                severity: hasMetrics ? "info" : "warning",
                title: hasMetrics ? "Measurable impact detected" : "Add quantifiable achievements",
                description: hasMetrics
                    ? "The resume includes numbers, which helps credibility."
                    : "Add metrics such as dataset size, users impacted, time saved, or percentage improvement.",
            },
            {
                severity: "warning",
                title: "Tailor bullets to the target role",
                description: "Rewrite 2-3 bullets so they clearly connect tools, actions, and business outcomes from the JD.",
            },
        ],
    };
}
export function createOpeningInterviewMessage(field, level, jdAnalysis, resumeMatch) {
    const role = jdAnalysis?.title || field.replace("-", " ") || "this role";
    const skill = jdAnalysis?.keySkills?.[0] ||
        resumeMatch?.matchedSkills?.[0] ||
        "your strongest relevant skill";
    return {
        role: "assistant",
        content: `Hello! I'll run a ${level || "targeted"} interview for ${role}. Let's start with this: tell me about yourself and connect your background to ${skill}.`,
    };
}
export function respondToInterviewAnswer(answer, messages, jdAnalysis, resumeMatch) {
    const keySkill = jdAnalysis?.keySkills?.[messages.length % Math.max(1, jdAnalysis.keySkills.length)] ||
        resumeMatch?.missingSkills?.[0] ||
        "the role requirements";
    const hasMetric = /\d/.test(answer);
    return {
        role: "assistant",
        content: hasMetric
            ? `Good answer. You gave a concrete detail, which makes the story easier to trust. Next question: describe a time you used ${keySkill} to solve a practical problem.`
            : `Your answer has a useful direction, but it needs a clearer result. Next question: describe a time you used ${keySkill} and include one measurable outcome.`,
        feedback: hasMetric
            ? "Good specificity. Tighten the ending by naming the business or team impact."
            : "Use STAR and add a number, scope, or before/after result.",
    };
}
