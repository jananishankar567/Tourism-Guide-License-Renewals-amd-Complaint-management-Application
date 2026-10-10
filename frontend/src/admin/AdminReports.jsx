import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import { API_BASE_URL as API_URL } from "../api";
import "./AdminDashboard.css";
import "./AdminApplications.css";
import "./AdminReports.css";

const REPORT_TYPES = [
  ["All", "All reports"],
  ["applications", "Applications"],
  ["licenses", "Licenses & renewals"],
  ["complaints", "Complaints"],
];
const EMPTY_REPORT_RANGE = { startDate: "", endDate: "" };

function formatDate(date) {
  if (!date) return "All time";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toCsvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(report, reportType, startDate, endDate) {
  const rows = [
    ["Tourism Guide Licensing Administration - Report"],
    ["Report type", REPORT_TYPES.find(([value]) => value === reportType)?.[1]],
    ["Date range", `${formatDate(startDate)} to ${formatDate(endDate)}`],
    ["Generated", new Date(report.generatedAt).toLocaleString("en-IN")],
    [],
    ["Summary metric", "Count"],
  ];

  for (const [label, value] of Object.entries(report.overview)) {
    rows.push([label.replace(/([A-Z])/g, " $1").trim(), value ?? "N/A"]);
  }

  if (reportType === "All" || reportType === "applications") {
    rows.push(
      [],
      ["Application outcome", "Count"],
      ["Received", report.overview.totalApplications],
      ["Approved", report.overview.approvedApplications],
      ["Rejected", report.overview.rejectedApplications],
      ["Pending", report.overview.pendingApplications],
      ["Returned", report.overview.returnedApplications]
    );
    rows.push([], ["Application status", "Count"]);
    Object.entries(report.applications.statusCounts).forEach((row) =>
      rows.push(row)
    );
    rows.push([], ["Applications received by month", "Count"]);
    report.applications.monthlyTotals.forEach(({ month, total }) =>
      rows.push([month, total])
    );
  }

  if (reportType === "All") {
    rows.push([], ["Recorded module activity", "Count"]);
    rows.push(
      ["License applications received", report.moduleActivity.applicationsReceived],
      ["Renewal requests submitted", report.moduleActivity.renewalsSubmitted],
      ["Complaints submitted", report.moduleActivity.complaintsSubmitted],
      ["Licenses issued", report.moduleActivity.licensesIssued],
      ["Total tracked module actions", report.moduleActivity.totalTrackedActions]
    );
  }

  if (reportType === "All" || reportType === "licenses") {
    rows.push([], ["Renewal status", "Count"]);
    Object.entries(report.renewals.statusCounts).forEach((row) =>
      rows.push(row)
    );
    rows.push([], ["License status", "Count"]);
    rows.push(["Active", report.licenses.active]);
    rows.push(["Expired", report.licenses.expired]);
  }

  if (reportType === "All" || reportType === "complaints") {
    rows.push([], ["Complaint status", "Count"]);
    Object.entries(report.complaints.statusCounts).forEach((row) =>
      rows.push(row)
    );
    rows.push([], ["Complaint category", "Count"]);
    Object.entries(report.complaints.categoryCounts).forEach((row) =>
      rows.push(row)
    );
  }

  const csv = rows.map((row) => row.map(toCsvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tourism-guide-report-${reportType.toLowerCase()}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadPdf(report, reportType, startDate, endDate) {
  const pdf = new jsPDF();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 16;
  let y = 20;

  const ensureSpace = (height = 8) => {
    if (y + height > pageHeight - margin) {
      pdf.addPage();
      y = 20;
    }
  };

  const addLine = (text, options = {}) => {
    const { size = 10, bold = false, gap = 6 } = options;
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(String(text), 178);
    ensureSpace(lines.length * (size * 0.48) + gap);
    pdf.text(lines, margin, y);
    y += lines.length * (size * 0.48) + gap;
  };

  addLine("Reports & Analytics", { size: 20, bold: true, gap: 9 });
  addLine("Tourism Guide Licensing Administration", { size: 11, gap: 6 });
  addLine(`Report: ${REPORT_TYPES.find(([value]) => value === reportType)?.[1]}`);
  addLine(`Date range: ${formatDate(startDate)} to ${formatDate(endDate)}`);
  addLine(`Generated: ${new Date(report.generatedAt).toLocaleString("en-IN")}`, {
    gap: 10,
  });
  addLine("Overview", { size: 14, bold: true, gap: 8 });

  const overviewRows = [
    ["Total applications", report.overview.totalApplications],
    ["Approved applications", report.overview.approvedApplications],
    ["Rejected applications", report.overview.rejectedApplications],
    ["Pending applications", report.overview.pendingApplications],
    ["Licenses issued", report.overview.licensesIssued],
    ["Active licenses", report.overview.activeLicenses],
    ["Expired licenses", report.overview.expiredLicenses],
    ["Renewals pending", report.overview.renewalsPending],
    ["Renewals approved", report.overview.renewalsApproved],
    ["Renewals rejected", report.overview.renewalsRejected],
    ["Complaints received", report.overview.totalComplaints],
    ["Complaints pending", report.overview.pendingComplaints],
    ["Complaints resolved / closed", report.overview.resolvedComplaints],
    [
      "Average resolution time (days)",
      report.overview.averageResolutionDays ?? "Not available",
    ],
  ];
  overviewRows.forEach(([label, value]) => addLine(`${label}: ${value}`));

  if (reportType === "All" || reportType === "applications") {
    y += 3;
    addLine("Application outcomes", { size: 14, bold: true, gap: 8 });
    [
      ["Received", report.overview.totalApplications],
      ["Approved", report.overview.approvedApplications],
      ["Rejected", report.overview.rejectedApplications],
      ["Pending", report.overview.pendingApplications],
      ["Returned", report.overview.returnedApplications],
    ].forEach(([label, count]) => addLine(`${label}: ${count}`));
    y += 3;
    addLine("Applications by status", { size: 14, bold: true, gap: 8 });
    Object.entries(report.applications.statusCounts).forEach(([label, count]) =>
      addLine(`${label}: ${count}`)
    );
    y += 3;
    addLine("Applications received by month", {
      size: 14,
      bold: true,
      gap: 8,
    });
    report.applications.monthlyTotals.forEach(({ month, total }) =>
      addLine(`${month}: ${total}`)
    );
  }

  if (reportType === "All") {
    y += 3;
    addLine("Recorded module activity", { size: 14, bold: true, gap: 8 });
    addLine(`License applications received: ${report.moduleActivity.applicationsReceived}`);
    addLine(`Renewal requests submitted: ${report.moduleActivity.renewalsSubmitted}`);
    addLine(`Complaints submitted: ${report.moduleActivity.complaintsSubmitted}`);
    addLine(`Licenses issued: ${report.moduleActivity.licensesIssued}`);
    addLine(`Total tracked module actions: ${report.moduleActivity.totalTrackedActions}`);
    addLine("Module activity counts stored portal records, not visits or sign-ins.", {
      size: 9,
    });
  }

  if (reportType === "All" || reportType === "licenses") {
    y += 3;
    addLine("License and renewal reports", { size: 14, bold: true, gap: 8 });
    addLine(`Active licenses: ${report.licenses.active}`);
    addLine(`Expired licenses: ${report.licenses.expired}`);
    Object.entries(report.renewals.statusCounts).forEach(([label, count]) =>
      addLine(`Renewal ${label}: ${count}`)
    );
  }

  if (reportType === "All" || reportType === "complaints") {
    y += 3;
    addLine("Complaints by status", { size: 14, bold: true, gap: 8 });
    Object.entries(report.complaints.statusCounts).forEach(([label, count]) =>
      addLine(`${label}: ${count}`)
    );
    y += 3;
    addLine("Complaints by category", { size: 14, bold: true, gap: 8 });
    Object.entries(report.complaints.categoryCounts).forEach(
      ([label, count]) => addLine(`${label}: ${count}`)
    );
  }

  pdf.save(
    `tourism-guide-report-${reportType.toLowerCase()}-${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`
  );
}

function ReportBarList({ title, values, emptyMessage }) {
  const entries = Object.entries(values || {});
  const maximum = Math.max(1, ...entries.map(([, count]) => count));

  return (
    <section className="report-chart-card">
      <header>
        <h2>{title}</h2>
      </header>
      {entries.length === 0 ? (
        <p className="report-no-data">{emptyMessage}</p>
      ) : (
        <div className="report-bars">
          {entries.map(([label, count]) => (
            <div className="report-bar-row" key={label}>
              <span className="report-bar-label">{label}</span>
              <div
                className="report-bar-track"
                role="img"
                aria-label={`${label}: ${count}`}
              >
                <span style={{ width: `${(count / maximum) * 100}%` }} />
              </div>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ApplicationOutcomeChart({ overview }) {
  const outcomes = [
    { label: "Received", value: overview.totalApplications, color: "received" },
    { label: "Approved", value: overview.approvedApplications, color: "approved" },
    { label: "Rejected", value: overview.rejectedApplications, color: "rejected" },
    { label: "Pending", value: overview.pendingApplications, color: "pending" },
    { label: "Returned", value: overview.returnedApplications, color: "returned" },
  ];
  const maximum = Math.max(1, ...outcomes.map(({ value }) => value));

  return (
    <section className="report-chart-card report-outcomes-chart">
      <header>
        <h2>License application outcomes</h2>
        <p>Applications received compared with their current recorded status.</p>
      </header>
      <div className="report-outcome-bars">
        {outcomes.map(({ label, value, color }) => (
          <div className="report-outcome-row" key={label}>
            <span>{label}</span>
            <div className="report-outcome-track" role="img" aria-label={`${label}: ${value}`}>
              <span className={`outcome-${color}`} style={{ width: `${(value / maximum) * 100}%` }} />
            </div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <p className="report-chart-note">
        Status totals represent each application’s latest saved status.
      </p>
    </section>
  );
}

function ModuleActivityChart({ moduleActivity }) {
  const values = [
    ["License applications", moduleActivity.applicationsReceived],
    ["Renewal requests", moduleActivity.renewalsSubmitted],
    ["Complaints", moduleActivity.complaintsSubmitted],
    ["Licenses issued", moduleActivity.licensesIssued],
  ];
  const maximum = Math.max(1, ...values.map(([, count]) => count));

  return (
    <section className="report-chart-card report-module-usage-chart">
      <header>
        <h2>Portal module activity</h2>
        <p>Recorded submissions and license issuances in the selected period.</p>
      </header>
      <div className="report-bars">
        {values.map(([label, count]) => (
          <div className="report-bar-row" key={label}>
            <span className="report-bar-label">{label}</span>
            <div className="report-bar-track" role="img" aria-label={`${label}: ${count}`}>
              <span style={{ width: `${(count / maximum) * 100}%` }} />
            </div>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
      <p className="report-chart-note">
        This portal does not currently record page visits or sign-in activity; counts show database records created in the selected period.
      </p>
    </section>
  );
}

function AdminReports() {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [reportType, setReportType] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedRange, setAppliedRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async (range = EMPTY_REPORT_RANGE) => {
    const token = localStorage.getItem("officerToken");
    if (!token) {
      setError("Your officer session is missing. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (range.startDate) params.set("startDate", range.startDate);
      if (range.endDate) params.set("endDate", range.endDate);
      const query = params.toString();
      const response = await fetch(
        `${API_URL}/api/admin/reports${query ? `?${query}` : ""}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to generate reports.");
      }

      setReport(data);
      setAppliedRange(range);
    } catch (fetchError) {
      console.error("Admin report fetch error:", fetchError);
      setError(fetchError.message || "Unable to generate reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(EMPTY_REPORT_RANGE);
  }, [fetchReport]);

  const summaryCards = useMemo(() => {
    if (!report) return [];
    const { overview } = report;
    return [
      ["Total Applications", overview.totalApplications, "All applications received"],
      ["Approved", overview.approvedApplications, "Approved applications"],
      ["Rejected", overview.rejectedApplications, "Rejected applications"],
      ["Pending Applications", overview.pendingApplications, "Submitted or awaiting review"],
      ["Licenses Issued", overview.licensesIssued, "Approved licenses in the period"],
      ["Renewals Pending", overview.renewalsPending, "Awaiting officer decision"],
      ["Complaints Received", overview.totalComplaints, "All complaints received"],
      ["Complaints Resolved", overview.resolvedComplaints, "Resolved or closed"],
    ];
  }, [report]);

  const generateReport = (event) => {
    event.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      setError("Start date must be on or before the end date.");
      return;
    }
    fetchReport({ startDate, endDate });
  };

  const handleLogout = () => {
    localStorage.removeItem("officerToken");
    localStorage.removeItem("officer");
    navigate("/login");
  };

  const showApplications = reportType === "All" || reportType === "applications";
  const showLicenses = reportType === "All" || reportType === "licenses";
  const showComplaints = reportType === "All" || reportType === "complaints";

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo">TG</div>
          <div>
            <h2>Tourism Guide</h2>
            <span>Management Portal</span>
          </div>
        </div>

        <nav className="admin-navigation">
          <button className="admin-nav-item" onClick={() => navigate("/admin-dashboard")}>
            <span>▦</span> Dashboard
          </button>
          <button className="admin-nav-item" onClick={() => navigate("/admin-applications")}>
            <span>▤</span> Applications
          </button>
          <button className="admin-nav-item" onClick={() => navigate("/admin-renewals")}>
            <span>↻</span> Renewals
          </button>
          <button className="admin-nav-item" onClick={() => navigate("/admin-complaints")}>
            <span>⚑</span> Complaints
          </button>
          <button className="admin-nav-item" onClick={() => navigate("/admin-licenses")}>
            <span>▣</span> Licenses
          </button>
          <button className="admin-nav-item active" aria-current="page">
            <span>▥</span> Reports
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-user-mini">
            <div className="admin-avatar">A</div>
            <div className="admin-user-info">
              <strong>Administrator</strong>
              <span>Officer</span>
            </div>
          </div>
          <button className="admin-logout" onClick={handleLogout}>
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      <main className="admin-main reports-main">
        <header className="applications-header">
          <div>
            <p className="admin-page-label">ADMINISTRATION</p>
            <h1>Reports &amp; Analytics</h1>
            <p>Tourism Guide Licensing Administration</p>
          </div>
          <button
            className="application-refresh-button"
            type="button"
            onClick={() => fetchReport(appliedRange)}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </header>

        <form className="reports-filter-panel" onSubmit={generateReport}>
          <div className="reports-filter-heading">
            <div>
              <h2>Generate report</h2>
              <p>Select a report type and optional date range.</p>
            </div>
          </div>
          <div className="reports-filter-fields">
            <label>
              Report category
              <select
                value={reportType}
                onChange={(event) => setReportType(event.target.value)}
              >
                {REPORT_TYPES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              From
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
            <button type="submit" className="reports-generate-button" disabled={loading}>
              {loading ? "Generating..." : "Generate report"}
            </button>
          </div>
          {error && (
            <div className="reports-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => fetchReport(appliedRange)}>Try Again</button>
            </div>
          )}
        </form>

        {loading && !report ? (
          <div className="applications-loading reports-loading">
            <div className="loading-spinner" />
            <p>Loading report data...</p>
          </div>
        ) : report ? (
          <>
            <section className="reports-summary-grid">
              {summaryCards.map(([label, value, caption], index) => (
                <article className={`reports-summary-card report-accent-${index % 4}`} key={label}>
                  <span>{label}</span>
                  <strong>{loading ? "…" : value}</strong>
                  <small>{caption}</small>
                </article>
              ))}
            </section>

            {loading && <p className="reports-refreshing">Updating report…</p>}

            <div className="reports-actions">
              <p>
                Report period: <strong>{formatDate(appliedRange.startDate)}</strong> to{" "}
                <strong>{formatDate(appliedRange.endDate)}</strong>
              </p>
              <div>
                <button
                  type="button"
                  className="reports-export-button secondary"
                  onClick={() => downloadCsv(report, reportType, appliedRange.startDate, appliedRange.endDate)}
                >
                  ↓ Export CSV
                </button>
                <button
                  type="button"
                  className="reports-export-button"
                  onClick={() => downloadPdf(report, reportType, appliedRange.startDate, appliedRange.endDate)}
                >
                  ↓ Download PDF
                </button>
              </div>
            </div>

            <section className="reports-chart-grid">
              {showApplications && (
                <>
                  <ApplicationOutcomeChart overview={report.overview} />
                  <section className="report-chart-card report-monthly-chart">
                    <header>
                      <h2>Applications received by month</h2>
                      <p>
                        {appliedRange.startDate || appliedRange.endDate
                          ? "Monthly totals for the selected date range."
                          : "Monthly totals show the most recent 12 months; summary cards cover all time."}
                      </p>
                    </header>
                    {report.applications.monthlyTotals.length ? (
                      <div className="report-month-bars">
                        {report.applications.monthlyTotals.map(({ month, total }) => {
                          const peak = Math.max(
                            1,
                            ...report.applications.monthlyTotals.map((item) => item.total)
                          );
                          return (
                            <div className="report-month-column" key={month}>
                              <strong>{total}</strong>
                              <span style={{ height: `${Math.max(4, (total / peak) * 100)}%` }} />
                              <small>{month.slice(2)}</small>
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="report-no-data">No applications in this period.</p>}
                  </section>
                  <ReportBarList
                    title="Application status distribution"
                    values={report.applications.statusCounts}
                    emptyMessage="No application data available."
                  />
                  <section className="report-chart-card">
                    <header><h2>Application review indicators</h2></header>
                    <div className="report-indicator-list">
                      <p><span>Awaiting officer verification</span><strong>{report.applications.awaitingVerification}</strong></p>
                      <p><span>Returned for corrections</span><strong>{report.applications.returned}</strong></p>
                    </div>
                  </section>
                </>
              )}

              {reportType === "All" && (
                <ModuleActivityChart moduleActivity={report.moduleActivity} />
              )}

              {showLicenses && (
                <>
                  <ReportBarList
                    title="License status"
                    values={{
                      Active: report.licenses.active,
                      Expired: report.licenses.expired,
                      "Expiry Date Missing": report.licenses.expiryDateMissing,
                    }}
                    emptyMessage="No license data available."
                  />
                  <ReportBarList
                    title="Renewal decisions"
                    values={report.renewals.statusCounts}
                    emptyMessage="No renewal data available."
                  />
                </>
              )}

              {showComplaints && (
                <>
                  <ReportBarList
                    title="Complaints by status"
                    values={report.complaints.statusCounts}
                    emptyMessage="No complaint data available."
                  />
                  <ReportBarList
                    title="Complaints by category"
                    values={report.complaints.categoryCounts}
                    emptyMessage="No complaint data available."
                  />
                  <section className="report-chart-card">
                    <header><h2>Resolution time</h2></header>
                    <div className="report-resolution-stat">
                      <strong>{report.complaints.averageResolutionDays ?? "—"}</strong>
                      <span>
                        {report.complaints.averageResolutionDays === null
                          ? "Not enough resolved complaint timestamps"
                          : "average days to resolve"}
                      </span>
                    </div>
                  </section>
                </>
              )}
            </section>
          </>
        ) : (
          <div className="applications-empty">
            <h3>No report data available</h3>
            <p>Try generating the report again.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminReports;
