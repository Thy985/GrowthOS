import type { GrowthReport } from '../types/reportTypes';

export function exportReportToMarkdown(report: GrowthReport): string {
  const lines: string[] = [];

  // Title
  lines.push(`# 成长报告`);
  lines.push('');
  lines.push(`**周期**: ${report.startDate} ~ ${report.endDate}`);
  lines.push(`**生成时间**: ${report.generatedAt}`);
  lines.push('');

  // Summary
  lines.push('## 概览');
  lines.push('');
  lines.push(`| 指标 | 数值 |`);
  lines.push(`|------|------|`);
  lines.push(`| 总经历数 | ${report.stats.totalExperiences} |`);
  lines.push(`| 本期新增经历 | ${report.stats.newExperiences} |`);
  lines.push(`| 活跃能力 | ${report.stats.activeCapabilities} |`);
  lines.push(`| 项目总数 | ${report.stats.totalProjects} |`);
  lines.push(`| 进行中项目 | ${report.stats.activeProjects} |`);
  lines.push(`| 已完成项目 | ${report.stats.completedProjects} |`);
  lines.push(`| 原则总数 | ${report.stats.totalPrinciples} |`);
  lines.push('');

  // Coach Diagnosis
  lines.push('## 诊断摘要');
  lines.push('');
  lines.push(`> ${report.diagnosis.summary.headline}`);
  lines.push('');

  if (report.diagnosis.summary.highlights.length > 0) {
    lines.push('### 亮点');
    lines.push('');
    for (const h of report.diagnosis.summary.highlights) {
      lines.push(`- ${h}`);
    }
    lines.push('');
  }

  if (report.diagnosis.summary.concerns.length > 0) {
    lines.push('### 需关注');
    lines.push('');
    for (const c of report.diagnosis.summary.concerns) {
      lines.push(`- ${c}`);
    }
    lines.push('');
  }

  if (report.diagnosis.summary.nextAction) {
    lines.push(`**下一步**: ${report.diagnosis.summary.nextAction}`);
    lines.push('');
  }

  // Capability Changes
  lines.push('## 能力变化');
  lines.push('');

  if (report.topGainers.length > 0) {
    lines.push('### 增长 TOP 5');
    lines.push('');
    lines.push('| 能力 | 当前等级 | 变化 |');
    lines.push('|------|----------|------|');
    for (const g of report.topGainers) {
      lines.push(
        `| ${g.metric.name} | ${g.metric.currentLevel}/${g.metric.targetLevel} | +${g.change} |`,
      );
    }
    lines.push('');
  }

  if (report.decliners.length > 0) {
    lines.push('### 需关注的能力');
    lines.push('');
    lines.push('| 能力 | 当前等级 | 变化 |');
    lines.push('|------|----------|------|');
    for (const d of report.decliners) {
      lines.push(
        `| ${d.metric.name} | ${d.metric.currentLevel}/${d.metric.targetLevel} | ${d.change} |`,
      );
    }
    lines.push('');
  }

  // Insights
  if (report.diagnosis.insights.length > 0) {
    lines.push('## 洞察分析');
    lines.push('');
    for (const insight of report.diagnosis.insights) {
      const severity =
        insight.severity === 'important' ? '🔴' : insight.severity === 'notice' ? '🟡' : '🔵';
      lines.push(`- ${severity} **${insight.title}**`);
      if (insight.description) {
        lines.push(`  ${insight.description}`);
      }
    }
    lines.push('');
  }

  // Recommendations
  if (report.diagnosis.recommendations.length > 0) {
    lines.push('## 推荐下一步');
    lines.push('');
    for (const rec of report.diagnosis.recommendations) {
      const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      lines.push(`- ${priority} **${rec.title}**: ${rec.action}`);
    }
    lines.push('');
  }

  // Top Principles
  if (report.stats.topPrinciples.length > 0) {
    lines.push('## 核心原则');
    lines.push('');
    for (let i = 0; i < report.stats.topPrinciples.length; i++) {
      lines.push(`${i + 1}. ${report.stats.topPrinciples[i]}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('*报告由 GrowthOS AI 成长教练自动生成*');

  return lines.join('\n');
}

export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
