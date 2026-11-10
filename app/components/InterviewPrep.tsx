import { useState, useMemo } from "react";

interface InterviewQuestion {
  id: string;
  category: "Technical" | "Metrics & Impact" | "Addressing Gaps" | "Behavioral STAR";
  question: string;
  interviewerIntent: string;
  recommendedFramework: {
    situation: string;
    action: string;
    result: string;
  };
  metricsToMention: string[];
}

interface InterviewPrepProps {
  feedback?: Feedback | null;
  jobTitle?: string;
  companyName?: string;
}

export const InterviewPrep = ({ feedback, jobTitle = "Software Engineer", companyName }: InterviewPrepProps) => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>("q-1");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Synthesize realistic high-yield questions tailored to this specific resume & feedback gaps
  const questions = useMemo<InterviewQuestion[]>(() => {
    const missingKeys = feedback?.keywordAnalysis?.missing || [];
    const missingSample = missingKeys.slice(0, 3).join(", ");
    const exp = feedback?.experienceLevel || "entry";

    const list: InterviewQuestion[] = [
      {
        id: "q-1",
        category: "Metrics & Impact",
        question: `Walk me through your most technically complex project for ${jobTitle}. How did you measure success?`,
        interviewerIntent:
          "Looking for concrete data over vague descriptions. They want to see if you instinctively track latency, throughput, error rates, or business outcomes.",
        recommendedFramework: {
          situation: "Frame the technical problem, user scale, or production bottleneck before your changes.",
          action:
            "Explain your specific architecture decisions, tradeoffs evaluated (e.g., caching vs database optimization), and how you validated the solution.",
          result:
            "Quote exact percentages or numbers (e.g., 'reduced client payload by 98%', 'improved p95 response time from 1.2s to 180ms').",
        },
        metricsToMention: ["Throughput / RPS", "Latency (p95 / p99)", "Resource utilization", "CI/CD cycle time"],
      },
      {
        id: "q-2",
        category: "Technical",
        question: `In your work, how do you approach API reliability, error handling, and state management under high load?`,
        interviewerIntent:
          "Testing architectural maturity. Do you consider edge cases, network partitioning, optimistic updates, and idempotent operations?",
        recommendedFramework: {
          situation: "Describe a scenario where network latency, dropped packets, or concurrent state mutations risked data integrity.",
          action:
            "Detail how you implemented retry policies with exponential backoff, circuit breakers, or optimistic state caching with rollback guarantees.",
          result:
            "Zero state corruption during offline recovery and 99.9% fault tolerance in asynchronous workflows.",
        },
        metricsToMention: ["Idempotency keys", "Exponential backoff", "Cache invalidation", "Error budget"],
      },
    ];

    if (missingKeys.length > 0) {
      list.push({
        id: "q-3",
        category: "Addressing Gaps",
        question: `Our stack heavily relies on ${missingSample || "modern cloud infrastructure"}. How would you transition your current expertise to ramp up quickly?`,
        interviewerIntent:
          "Testing adaptability and engineering fundamentals. They want to hear that core concepts transfer effortlessly across frameworks or cloud tools.",
        recommendedFramework: {
          situation:
            "Acknowledge the specific technology while mapping analogous patterns from tools you already master.",
          action:
            "Explain your proven rapid-onboarding framework: reading RFCs, building a sandbox spike, dissecting production post-mortems.",
          result:
            "Demonstrated history of shipping production features within your first 2 weeks in past migrations.",
        },
        metricsToMention: ["Fundamental patterns", "Abstraction layers", "Fast prototyping", "Documentation rigor"],
      });
    }

    list.push(
      {
        id: "q-4",
        category: "Behavioral STAR",
        question: `Tell me about a time you encountered a severe production bug or architectural disagreement. How did you resolve it?`,
        interviewerIntent:
          "Evaluating emotional intelligence, blameless root-cause analysis, and how you communicate technical tradeoffs with team members.",
        recommendedFramework: {
          situation:
            "A critical regression deployed right before a milestone release or a disagreement on API schema design.",
          action:
            "De-escalated by establishing measurable benchmarks, gathering telemetry data, and organizing a structured 15-minute sync with paired debugging.",
          result:
            "Shipped hotfix with zero downtime, introduced automated regression suites to prevent recurrence, and authored a post-mortem.",
        },
        metricsToMention: ["Blameless post-mortem", "Telemetry signals", "Automated regression suite", "Team alignment"],
      },
      {
        id: "q-5",
        category: exp === "senior" ? "Technical" : "Metrics & Impact",
        question:
          exp === "senior"
            ? `How do you mentor engineers and establish technical standards across code reviews, testing, and system design?`
            : `How do you ensure your code is thoroughly tested and maintainable before opening a Pull Request?`,
        interviewerIntent:
          exp === "senior"
            ? "Assessing multiplier impact on the broader engineering organization."
            : "Verifying quality discipline—unit tests, mock contracts, typing rigor, and minimal reviewer cycle friction.",
        recommendedFramework: {
          situation:
            exp === "senior"
              ? "Noticeable inconsistency in PR review turnarounds or test coverage across multiple microservices."
              : "Building a complex feature touching critical billing or authentication flows.",
          action:
            "Established automated linting/formatting in CI, wrote exhaustive unit & integration tests targeting edge cases, and documented RFCs.",
          result: "Reduced PR review cycles from 3 days to under 4 hours, maintaining 90%+ critical path coverage.",
        },
        metricsToMention: ["Code coverage", "PR review latency", "Linting & static analysis", "Contract testing"],
      }
    );

    return list;
  }, [feedback, jobTitle]);

  const categories = ["All", "Technical", "Metrics & Impact", "Addressing Gaps", "Behavioral STAR"];

  const filteredQuestions = useMemo(() => {
    if (activeCategory === "All") return questions;
    return questions.filter((q) => q.category === activeCategory);
  }, [questions, activeCategory]);

  const handleCopy = (q: InterviewQuestion) => {
    const text = `Q: ${q.question}\n\nInterviewer Intent:\n${q.interviewerIntent}\n\nSTAR Answering Framework:\n• Situation: ${q.recommendedFramework.situation}\n• Action: ${q.recommendedFramework.action}\n• Result: ${q.recommendedFramework.result}\n\nKey Metrics to Mention:\n${q.metricsToMention.join(", ")}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(q.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div
      className="score-overview-card"
      style={{
        background: "#ffffff",
        border: "1px solid #e6e5e0",
        borderRadius: "12px",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "1.125rem" }}>🎙️</span>
            <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 500, color: "#26251e" }}>
              AI Interview Preparation Simulator
            </h3>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                padding: "0.15rem 0.45rem",
                borderRadius: "4px",
                background: "#f54e0012",
                color: "#f54e00",
                fontWeight: 600,
              }}
            >
              TAILORED
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#807d72" }}>
            High-yield questions targeted at this candidate profile, identified skill gaps, and STAR talking points.
          </p>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "0.25rem 0.625rem",
                  fontSize: "0.75rem",
                  borderRadius: "6px",
                  border: isActive ? "1px solid #26251e" : "1px solid #e6e5e0",
                  background: isActive ? "#26251e" : "#fafaf7",
                  color: isActive ? "#ffffff" : "#5a5852",
                  cursor: "pointer",
                  transition: "all 0.1s ease",
                  fontFamily: "inherit",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {filteredQuestions.map((q, idx) => {
          const isExpanded = expandedId === q.id;
          const isCopied = copiedId === q.id;

          return (
            <div
              key={q.id}
              style={{
                border: isExpanded ? "1px solid #cfcdc4" : "1px solid #e6e5e0",
                borderRadius: "8px",
                background: isExpanded ? "#fafaf7" : "#ffffff",
                transition: "all 0.15s ease",
                overflow: "hidden",
              }}
            >
              {/* Question summary banner */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.875rem 1rem",
                  cursor: "pointer",
                  userSelect: "none",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "#807d72",
                      minWidth: "1.5rem",
                    }}
                  >
                    0{idx + 1}
                  </span>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "#26251e",
                      lineHeight: 1.4,
                    }}
                  >
                    {q.question}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexShrink: 0 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6875rem",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "4px",
                      background: "#efeee8",
                      color: "#5a5852",
                    }}
                  >
                    {q.category}
                  </span>
                  <span
                    style={{
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                      fontSize: "0.75rem",
                      color: "#807d72",
                    }}
                  >
                    ▼
                  </span>
                </div>
              </div>

              {/* Collapsible Answer Framework */}
              {isExpanded && (
                <div
                  style={{
                    padding: "0 1rem 1rem 1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.875rem",
                    borderTop: "1px solid #efeee8",
                    paddingTop: "0.875rem",
                  }}
                >
                  {/* Interviewer Intent Box */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e6e5e0",
                      borderRadius: "6px",
                      padding: "0.75rem 0.875rem",
                      fontSize: "0.8125rem",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "#26251e", display: "block", marginBottom: "0.25rem" }}>
                      💡 Interviewer&apos;s Hidden Evaluation Objective:
                    </span>
                    <span style={{ color: "#5a5852", lineHeight: 1.45 }}>{q.interviewerIntent}</span>
                  </div>

                  {/* STAR Method Blueprint */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e6e5e0",
                      borderRadius: "6px",
                      padding: "0.875rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6875rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "#807d72",
                        fontWeight: 600,
                      }}
                    >
                      Recommended STAR Talking Points
                    </span>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", fontSize: "0.8125rem" }}>
                      <div>
                        <strong style={{ color: "#26251e" }}>Situation: </strong>
                        <span style={{ color: "#5a5852" }}>{q.recommendedFramework.situation}</span>
                      </div>
                      <div>
                        <strong style={{ color: "#26251e" }}>Action: </strong>
                        <span style={{ color: "#5a5852" }}>{q.recommendedFramework.action}</span>
                      </div>
                      <div>
                        <strong style={{ color: "#008542" }}>Result (Metrics): </strong>
                        <span style={{ color: "#5a5852" }}>{q.recommendedFramework.result}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics to highlight & Copy button */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                      paddingTop: "0.25rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.6875rem",
                          color: "#807d72",
                          marginRight: "0.25rem",
                        }}
                      >
                        Signal Keywords:
                      </span>
                      {q.metricsToMention.map((m) => (
                        <span
                          key={m}
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.6875rem",
                            background: "#efeee8",
                            color: "#26251e",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "4px",
                          }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(q)}
                      className="back-button"
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.35rem 0.65rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        background: isCopied ? "#e8f5e9" : "#ffffff",
                        borderColor: isCopied ? "#81c784" : "#e6e5e0",
                        color: isCopied ? "#2e7d32" : "#26251e",
                      }}
                    >
                      <span>{isCopied ? "✓" : "📋"}</span>
                      <span>{isCopied ? "Copied Talking Point" : "Copy Outline"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InterviewPrep;
