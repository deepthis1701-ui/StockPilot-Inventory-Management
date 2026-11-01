import React, { useState } from 'react';
import {
  BarChart3,
  ShoppingCart,
  TrendingUp,
  CalendarDays,
  ArrowRight,
  Download,
  Printer,
  CheckCircle2,
} from 'lucide-react';

const reportOptions = [
  {
    id: 'performance',
    icon: BarChart3,
    title: 'How is my store doing?',
    description: 'See your sales and overall store performance.',
  },
  {
    id: 'buy',
    icon: ShoppingCart,
    title: 'What should I buy?',
    description: 'See which products may need to be purchased next.',
  },
  {
    id: 'selling',
    icon: TrendingUp,
    title: 'What are customers buying?',
    description: 'Find your best-selling and fast-growing products.',
  },
  {
    id: 'weekly',
    icon: CalendarDays,
    title: 'Give me my weekly summary',
    description: 'Get a simple summary of what happened this week.',
  },
];

const reports = {
  performance: {
    title: 'How is my store doing?',
    intro:
      'Your store is performing well this week, with sales showing steady growth.',
    items: [
      ['Sales this week', '₹1,84,650'],
      ['Products sold', '4,286'],
      ['Sales growth', '+9.8%'],
      ['Average daily sales', '₹26,379'],
    ],
    message:
      'Fresh products and everyday essentials are contributing strongly to this week’s sales.',
  },

  buy: {
    title: 'What should I buy?',
    intro:
      'There are a few products worth reviewing before your next supplier purchase.',
    items: [
      ['Fresh Tomatoes', '60 units'],
      ['Fresh Milk 1L', '40 units'],
      ['Chana Dal', '43 units'],
      ['Mineral Water', '35 units'],
    ],
    message:
      'Prioritize Fresh Tomatoes and Fresh Milk because they are being purchased by customers quickly.',
  },

  selling: {
    title: 'What are customers buying?',
    intro:
      'These products are currently performing strongly in your store.',
    items: [
      ['Fresh Milk 1L', '1,248 units'],
      ['Farm Fresh Eggs', '846 units'],
      ['Basmati Rice 5kg', '782 units'],
      ['Fresh Tomatoes', '731 units'],
    ],
    message:
      'Fresh Tomatoes have the strongest recent growth, while Fresh Milk continues to be your top-selling product.',
  },

  weekly: {
    title: 'Give me my weekly summary',
    intro:
      'Here is a quick view of the most important things from this week.',
    items: [
      ['Sales', '₹1,84,650'],
      ['Best seller', 'Fresh Milk 1L'],
      ['Fastest growing', 'Fresh Tomatoes'],
      ['Purchases to review', '2'],
    ],
    message:
      'Overall performance is positive. Review the priority purchases before your next supplier visit.',
  },
};

function Reports() {
  const [selected, setSelected] = useState('performance');
  const [period, setPeriod] = useState('This week');
  const [generated, setGenerated] = useState(false);

  const currentReport = reports[selected];

  const generateReport = () => {
    setGenerated(true);

    setTimeout(() => {
      setGenerated(false);
    }, 1800);
  };

  const exportReport = () => {
    const content = [
      'STOCKPILOT BUSINESS REPORT',
      '',
      currentReport.title,
      `Period: ${period}`,
      '',
      currentReport.intro,
      '',
      ...currentReport.items.map(
        ([label, value]) => `${label}: ${value}`
      ),
      '',
      currentReport.message,
    ].join('\n');

    const blob = new Blob([content], {
      type: 'text/plain;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'stockpilot-report.txt';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="reports-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .reports-page {
          min-height: 100%;
          padding: 34px 38px;
          background: #f7f8fa;
          color: #182230;
        }

        .reports-container {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
        }

        /* HEADER */

        .reports-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 30px;
          padding-bottom: 30px;
          border-bottom: 1px solid #e5e9ee;
        }

        .header-copy {
          max-width: 650px;
        }

        .reports-kicker {
          margin-bottom: 9px;
          color: #7b8794;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .reports-header h1 {
          margin: 0;
          color: #172033;
          font-size: 31px;
          line-height: 1.15;
          font-weight: 760;
          letter-spacing: -0.035em;
        }

        .reports-header p {
          margin: 10px 0 0;
          color: #687586;
          font-size: 13px;
          line-height: 1.6;
        }

        .period-box {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 175px;
          padding: 9px 12px;
          background: #fff;
          border: 1px solid #dfe4ea;
          border-radius: 8px;
        }

        .period-box span {
          color: #8a95a3;
          font-size: 11px;
          font-weight: 600;
        }

        .period-box select {
          flex: 1;
          border: 0;
          outline: none;
          background: transparent;
          color: #273244;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        /* REPORT NAVIGATION */

        .reports-section {
          margin-top: 28px;
        }

        .section-heading {
          margin-bottom: 11px;
          color: #7b8794;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .report-list {
          background: #fff;
          border: 1px solid #e0e5eb;
          border-radius: 12px;
          overflow: hidden;
        }

        .report-choice {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          min-height: 78px;
          padding: 14px 20px;
          border: 0;
          border-bottom: 1px solid #edf0f3;
          background: #fff;
          text-align: left;
          cursor: pointer;
          transition:
            background 0.16s ease,
            padding 0.16s ease;
        }

        .report-choice:last-child {
          border-bottom: 0;
        }

        .report-choice:hover {
          background: #fafbfc;
        }

        .report-choice.active {
          background: #f5f7f9;
        }

        .report-choice.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #172033;
        }

        .choice-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          margin-right: 17px;
          border: 1px solid #e2e6eb;
          border-radius: 8px;
          background: #fafbfc;
          color: #596575;
        }

        .report-choice.active .choice-icon {
          background: #fff;
          color: #172033;
          border-color: #d8dde4;
        }

        .choice-content {
          min-width: 0;
          flex: 1;
        }

        .report-choice h3 {
          margin: 0;
          color: #202b3b;
          font-size: 13px;
          line-height: 1.4;
          font-weight: 720;
        }

        .report-choice p {
          margin: 4px 0 0;
          color: #7b8794;
          font-size: 11px;
          line-height: 1.45;
        }

        .choice-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          margin-left: 15px;
          color: #a0a9b4;
          transition: transform 0.16s ease;
        }

        .report-choice:hover .choice-arrow,
        .report-choice.active .choice-arrow {
          color: #394657;
          transform: translateX(2px);
        }

        /* REPORT DOCUMENT */

        .report-document {
          margin-top: 30px;
          background: #fff;
          border: 1px solid #dfe4ea;
          border-radius: 12px;
          overflow: hidden;
        }

        .document-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 25px;
          padding: 25px 28px;
          border-bottom: 1px solid #e8ebef;
        }

        .document-heading {
          min-width: 0;
        }

        .document-meta {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 8px;
          color: #8b96a3;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .meta-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #b8c0c9;
        }

        .document-header h2 {
          margin: 0;
          color: #172033;
          font-size: 21px;
          line-height: 1.3;
          font-weight: 760;
          letter-spacing: -0.025em;
        }

        .report-actions {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
        }

        .action-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 34px;
          padding: 0 11px;
          border: 1px solid #dfe4ea;
          border-radius: 7px;
          background: #fff;
          color: #566273;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-button:hover {
          background: #f7f8fa;
          border-color: #cbd2da;
          color: #263244;
        }

        .generate-button {
          border-color: #172033;
          background: #172033;
          color: #fff;
        }

        .generate-button:hover {
          border-color: #263244;
          background: #263244;
          color: #fff;
        }

        .generate-button.ready {
          border-color: #16803c;
          background: #16803c;
        }

        /* DOCUMENT BODY */

        .document-body {
          padding: 28px;
        }

        .report-intro {
          max-width: 760px;
          margin: 0 0 27px;
          color: #657283;
          font-size: 13px;
          line-height: 1.7;
        }

        .report-results {
          border-top: 1px solid #edf0f3;
        }

        .result-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          min-height: 55px;
          padding: 0 4px;
          border-bottom: 1px solid #edf0f3;
        }

        .result-label {
          color: #667384;
          font-size: 12px;
        }

        .result-value {
          color: #172033;
          font-size: 13px;
          font-weight: 750;
          text-align: right;
        }

        /* MEANING */

        .meaning-section {
          margin-top: 28px;
          padding: 19px 21px;
          border: 1px solid #e4e8ed;
          border-radius: 9px;
          background: #fafbfc;
        }

        .meaning-heading {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 7px;
          color: #273244;
          font-size: 11px;
          font-weight: 750;
        }

        .meaning-marker {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #667384;
        }

        .meaning-section p {
          margin: 0;
          color: #697686;
          font-size: 12px;
          line-height: 1.65;
        }

        /* FOOTER */

        .document-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 12px 28px;
          border-top: 1px solid #e8ebef;
          background: #fbfcfd;
          color: #9aa4af;
          font-size: 10px;
        }

        .footer-brand {
          color: #6f7b89;
          font-weight: 700;
        }

        /* RESPONSIVE */

        @media (max-width: 800px) {
          .reports-page {
            padding: 25px;
          }

          .reports-header {
            flex-direction: column;
            align-items: stretch;
          }

          .period-box {
            width: 100%;
          }

          .document-header {
            flex-direction: column;
          }

          .report-actions {
            width: 100%;
          }

          .action-button {
            flex: 1;
          }
        }

        @media (max-width: 560px) {
          .reports-page {
            padding: 17px;
          }

          .reports-header h1 {
            font-size: 26px;
          }

          .report-choice {
            min-height: 72px;
            padding: 12px 14px;
          }

          .choice-icon {
            width: 34px;
            height: 34px;
            margin-right: 12px;
          }

          .choice-arrow {
            margin-left: 8px;
          }

          .report-choice p {
            display: none;
          }

          .document-header,
          .document-body {
            padding: 20px;
          }

          .document-header h2 {
            font-size: 18px;
          }

          .report-actions {
            flex-wrap: wrap;
          }

          .action-button {
            flex: 1;
            min-width: 85px;
          }

          .result-row {
            min-height: 52px;
          }

          .document-footer {
            padding: 11px 20px;
          }
        }

        /* PRINT */

        @media print {
          .reports-page {
            padding: 0;
            background: #fff;
          }

          .reports-header,
          .reports-section,
          .report-actions {
            display: none !important;
          }

          .report-document {
            margin: 0;
            border: none;
            border-radius: 0;
          }

          .document-header {
            padding: 20px 0;
          }

          .document-body {
            padding: 20px 0;
          }

          .document-footer {
            padding-left: 0;
            padding-right: 0;
          }
        }
      `}</style>

      <div className="reports-container">

        {/* HEADER */}
        <header className="reports-header">
          <div className="header-copy">
            <div className="reports-kicker">
              Business workspace
            </div>

            <h1>Business Reports</h1>

            <p>
              Get quick answers about your store without complicated
              information.
            </p>
          </div>

          <div className="period-box">
            <span>Reporting period</span>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option>This week</option>
              <option>Last 7 days</option>
              <option>This month</option>
              <option>Last 30 days</option>
            </select>
          </div>
        </header>

        {/* REPORT OPTIONS */}
        <section className="reports-section">
          <div className="section-heading">
            What would you like to know?
          </div>

          <div className="report-list">
            {reportOptions.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  key={option.id}
                  className={`report-choice ${
                    selected === option.id ? 'active' : ''
                  }`}
                  onClick={() => setSelected(option.id)}
                >
                  <div className="choice-icon">
                    <Icon size={17} strokeWidth={1.8} />
                  </div>

                  <div className="choice-content">
                    <h3>{option.title}</h3>

                    <p>{option.description}</p>
                  </div>

                  <div className="choice-arrow">
                    <ArrowRight size={15} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* REPORT DOCUMENT */}
        <section className="report-document">

          <div className="document-header">
            <div className="document-heading">
              <div className="document-meta">
                <span>{period}</span>
                <span className="meta-dot"></span>
                <span>StockPilot</span>
              </div>

              <h2>{currentReport.title}</h2>
            </div>

            <div className="report-actions">
              <button
                className="action-button"
                onClick={exportReport}
              >
                <Download size={13} />
                Export
              </button>

              <button
                className="action-button"
                onClick={printReport}
              >
                <Printer size={13} />
                Print
              </button>

              <button
                className={`action-button generate-button ${
                  generated ? 'ready' : ''
                }`}
                onClick={generateReport}
              >
                {generated ? (
                  <>
                    <CheckCircle2 size={13} />
                    Ready
                  </>
                ) : (
                  <>
                    Generate
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="document-body">

            <p className="report-intro">
              {currentReport.intro}
            </p>

            <div className="report-results">
              {currentReport.items.map(([label, value]) => (
                <div className="result-row" key={label}>
                  <span className="result-label">
                    {label}
                  </span>

                  <span className="result-value">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="meaning-section">
              <div className="meaning-heading">
                <span className="meaning-marker"></span>
                What this means for your store
              </div>

              <p>
                {currentReport.message}
              </p>
            </div>

          </div>

          <div className="document-footer">
            <span className="footer-brand">
              StockPilot
            </span>

            <span>
              Simple reports for your store
            </span>
          </div>

        </section>
      </div>
    </div>
  );
}

export default Reports;