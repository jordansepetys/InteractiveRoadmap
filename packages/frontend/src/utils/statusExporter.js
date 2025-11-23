/**
 * Status Export Utilities
 * Converts status updates to various formats for sharing/exporting
 */

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export as plain text (copy-paste friendly)
 */
export function exportAsPlainText(statusUpdate) {
  const { projectName, reportingPeriod, accomplishments, inProgress, blockers, nextSteps, risks, metrics } = statusUpdate;

  let text = `STATUS UPDATE\n`;
  text += `${'='.repeat(60)}\n\n`;

  if (projectName) {
    text += `Project: ${projectName}\n`;
  }
  if (reportingPeriod) {
    text += `Period: ${reportingPeriod}\n`;
  }
  text += `\n`;

  if (accomplishments && accomplishments.length > 0) {
    text += `ACCOMPLISHMENTS\n`;
    text += `${'-'.repeat(60)}\n`;
    accomplishments.forEach(item => {
      text += `• ${item}\n`;
    });
    text += `\n`;
  }

  if (inProgress && inProgress.length > 0) {
    text += `IN PROGRESS\n`;
    text += `${'-'.repeat(60)}\n`;
    inProgress.forEach(item => {
      text += `• ${item}\n`;
    });
    text += `\n`;
  }

  if (blockers && blockers.length > 0) {
    text += `BLOCKERS\n`;
    text += `${'-'.repeat(60)}\n`;
    blockers.forEach(item => {
      text += `• ${item}\n`;
    });
    text += `\n`;
  }

  if (nextSteps && nextSteps.length > 0) {
    text += `NEXT STEPS\n`;
    text += `${'-'.repeat(60)}\n`;
    nextSteps.forEach(item => {
      text += `• ${item}\n`;
    });
    text += `\n`;
  }

  if (risks && risks.length > 0) {
    text += `RISKS\n`;
    text += `${'-'.repeat(60)}\n`;
    risks.forEach(item => {
      text += `• ${item}\n`;
    });
    text += `\n`;
  }

  if (metrics && Object.keys(metrics).length > 0) {
    text += `METRICS\n`;
    text += `${'-'.repeat(60)}\n`;
    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
        const capitalizedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
        text += `${capitalizedKey}: ${value}\n`;
      }
    });
    text += `\n`;
  }

  text += `\n${'='.repeat(60)}\n`;
  text += `Generated with Aiba\n`;

  return text;
}

/**
 * Export as markdown (GitHub/ADO compatible)
 */
export function exportAsMarkdown(update) {
  // If update is a simple string (pre-formatted), return it
  if (typeof update === 'string') {
    return update;
  }

  // Otherwise, format from structured data
  const { projectName, reportingPeriod, accomplishments, inProgress, blockers, nextSteps, risks, metrics } = update;

  let md = `# Status Update\n\n`;

  if (projectName) {
    md += `**Project:** ${projectName}  \n`;
  }
  if (reportingPeriod) {
    md += `**Period:** ${reportingPeriod}  \n`;
  }
  md += `\n`;

  if (accomplishments && accomplishments.length > 0) {
    md += `## ✅ Accomplishments\n\n`;
    accomplishments.forEach(item => {
      md += `- ${item}\n`;
    });
    md += `\n`;
  }

  if (inProgress && inProgress.length > 0) {
    md += `## 🚧 In Progress\n\n`;
    inProgress.forEach(item => {
      md += `- ${item}\n`;
    });
    md += `\n`;
  }

  if (blockers && blockers.length > 0) {
    md += `## 🚫 Blockers\n\n`;
    blockers.forEach(item => {
      md += `- ${item}\n`;
    });
    md += `\n`;
  }

  if (nextSteps && nextSteps.length > 0) {
    md += `## ⏭️ Next Steps\n\n`;
    nextSteps.forEach(item => {
      md += `- ${item}\n`;
    });
    md += `\n`;
  }

  if (risks && risks.length > 0) {
    md += `## ⚠️ Risks\n\n`;
    risks.forEach(item => {
      md += `- ${item}\n`;
    });
    md += `\n`;
  }

  if (metrics && Object.keys(metrics).length > 0) {
    md += `## 📊 Metrics\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
        const capitalizedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
        md += `| ${capitalizedKey} | ${value} |\n`;
      }
    });
    md += `\n`;
  }

  md += `---\n`;
  md += `*Generated with Aiba*\n`;

  return md;
}

/**
 * Export as HTML (email-ready with inline CSS)
 */
export function exportAsHTML(update) {
  // If update is a simple string (pre-formatted markdown), convert to HTML
  if (typeof update === 'string') {
    // Simple markdown-to-HTML conversion
    let html = update
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^\* (.+)$/gm, '<li>$1</li>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // Wrap lists
    html = html.replace(/(<li>.+<\/li>)/gs, '<ul>$1</ul>');

    // Wrap paragraphs
    html = '<p>' + html + '</p>';

    return wrapInHTMLTemplate(html);
  }

  // Otherwise, format from structured data
  const { projectName, reportingPeriod, accomplishments, inProgress, blockers, nextSteps, risks, metrics } = update;

  let body = '';

  body += `<h1 style="color: #2563eb; margin-bottom: 8px;">Status Update</h1>`;

  if (projectName || reportingPeriod) {
    body += `<div style="margin-bottom: 24px; color: #6b7280;">`;
    if (projectName) {
      body += `<p style="margin: 4px 0;"><strong>Project:</strong> ${projectName}</p>`;
    }
    if (reportingPeriod) {
      body += `<p style="margin: 4px 0;"><strong>Period:</strong> ${reportingPeriod}</p>`;
    }
    body += `</div>`;
  }

  if (accomplishments && accomplishments.length > 0) {
    body += `<h2 style="color: #059669; margin-top: 24px; margin-bottom: 12px;">✅ Accomplishments</h2>`;
    body += `<ul style="margin: 0; padding-left: 20px;">`;
    accomplishments.forEach(item => {
      body += `<li style="margin: 8px 0;">${item}</li>`;
    });
    body += `</ul>`;
  }

  if (inProgress && inProgress.length > 0) {
    body += `<h2 style="color: #f59e0b; margin-top: 24px; margin-bottom: 12px;">🚧 In Progress</h2>`;
    body += `<ul style="margin: 0; padding-left: 20px;">`;
    inProgress.forEach(item => {
      body += `<li style="margin: 8px 0;">${item}</li>`;
    });
    body += `</ul>`;
  }

  if (blockers && blockers.length > 0) {
    body += `<h2 style="color: #dc2626; margin-top: 24px; margin-bottom: 12px;">🚫 Blockers</h2>`;
    body += `<ul style="margin: 0; padding-left: 20px;">`;
    blockers.forEach(item => {
      body += `<li style="margin: 8px 0;">${item}</li>`;
    });
    body += `</ul>`;
  }

  if (nextSteps && nextSteps.length > 0) {
    body += `<h2 style="color: #2563eb; margin-top: 24px; margin-bottom: 12px;">⏭️ Next Steps</h2>`;
    body += `<ul style="margin: 0; padding-left: 20px;">`;
    nextSteps.forEach(item => {
      body += `<li style="margin: 8px 0;">${item}</li>`;
    });
    body += `</ul>`;
  }

  if (risks && risks.length > 0) {
    body += `<h2 style="color: #ea580c; margin-top: 24px; margin-bottom: 12px;">⚠️ Risks</h2>`;
    body += `<ul style="margin: 0; padding-left: 20px;">`;
    risks.forEach(item => {
      body += `<li style="margin: 8px 0;">${item}</li>`;
    });
    body += `</ul>`;
  }

  if (metrics && Object.keys(metrics).length > 0) {
    body += `<h2 style="color: #6366f1; margin-top: 24px; margin-bottom: 12px;">📊 Metrics</h2>`;
    body += `<table style="border-collapse: collapse; width: 100%; max-width: 400px;">`;
    body += `<thead><tr style="background-color: #f3f4f6;">`;
    body += `<th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Metric</th>`;
    body += `<th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Value</th>`;
    body += `</tr></thead>`;
    body += `<tbody>`;
    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
        const capitalizedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
        body += `<tr>`;
        body += `<td style="border: 1px solid #d1d5db; padding: 8px;">${capitalizedKey}</td>`;
        body += `<td style="border: 1px solid #d1d5db; padding: 8px;">${value}</td>`;
        body += `</tr>`;
      }
    });
    body += `</tbody></table>`;
  }

  body += `<hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">`;
  body += `<p style="color: #9ca3af; font-size: 14px; margin: 0;"><em>Generated with Aiba</em></p>`;

  return wrapInHTMLTemplate(body);
}

/**
 * Wrap HTML content in a complete HTML document template
 */
function wrapInHTMLTemplate(bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Status Update</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }
    h1, h2, h3 { margin-top: 24px; margin-bottom: 12px; }
    h1 { font-size: 28px; }
    h2 { font-size: 22px; }
    h3 { font-size: 18px; }
    ul { margin: 12px 0; padding-left: 24px; }
    li { margin: 8px 0; }
    p { margin: 8px 0; }
    table { margin: 16px 0; }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

/**
 * Generate email-ready format with subject line
 */
export function generateEmailFormat(statusUpdate) {
  const { projectName, reportingPeriod } = statusUpdate;

  let subject = 'Status Update';
  if (projectName) {
    subject += ` - ${projectName}`;
  }
  if (reportingPeriod) {
    subject += ` (${reportingPeriod})`;
  }

  const body = exportAsHTML(statusUpdate);

  return {
    subject,
    body,
  };
}

/**
 * Download update as a file
 */
export function downloadAsFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get word count and estimated read time
 */
export function getReadingStats(text) {
  if (!text) return { wordCount: 0, readTimeMinutes: 0 };

  const wordCount = text.trim().split(/\s+/).length;
  const readTimeMinutes = Math.ceil(wordCount / 200); // Average reading speed: 200 words/min

  return {
    wordCount,
    readTimeMinutes,
  };
}
