import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

export interface PerformanceMetrics {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  inp: number;
}

export interface MetricWithRating extends Metric {
  rating: 'good' | 'needs-improvement' | 'poor';
}

type MetricCallback = (metric: MetricWithRating) => void;

const isDevelopment = import.meta.env.DEV;

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0,
    inp: 0
  };
  private listeners: MetricCallback[] = [];
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      LCP: { good: 2500, needsImprovement: 4000 },
      CLS: { good: 0.1, needsImprovement: 0.25 },
      FID: { good: 100, needsImprovement: 300 },
      FCP: { good: 1800, needsImprovement: 3000 },
      TTFB: { good: 800, needsImprovement: 1800 },
      INP: { good: 200, needsImprovement: 500 }
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'needs-improvement';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  private handleMetric(metric: Metric): void {
    const metricWithRating: MetricWithRating = {
      ...metric,
      rating: this.getRating(metric.name, metric.value)
    };

    switch (metric.name) {
      case 'LCP':
        this.metrics.lcp = metric.value;
        break;
      case 'FID':
        this.metrics.fid = metric.value;
        break;
      case 'CLS':
        this.metrics.cls = metric.value;
        break;
      case 'FCP':
        this.metrics.fcp = metric.value;
        break;
      case 'TTFB':
        this.metrics.ttfb = metric.value;
        break;
      case 'INP':
        this.metrics.inp = metric.value;
        break;
    }

    this.listeners.forEach(listener => listener(metricWithRating));
  }

  subscribe(callback: MetricCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.isInitialized = true;

    onCLS((metric) => this.handleMetric(metric));
    onFID((metric) => this.handleMetric(metric));
    onFCP((metric) => this.handleMetric(metric));
    onLCP((metric) => this.handleMetric(metric));
    onTTFB((metric) => this.handleMetric(metric));
    onINP((metric) => this.handleMetric(metric));
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getMetricSummary(): string {
    return `LCP: ${this.metrics.lcp.toFixed(0)}ms | FID: ${this.metrics.fid.toFixed(0)}ms | CLS: ${this.metrics.cls.toFixed(3)}`;
  }

  reportToConsole(): void {
    console.group('📊 Performance Metrics');
    console.log('LCP (Largest Contentful Paint):', `${this.metrics.lcp.toFixed(0)}ms`);
    console.log('FID (First Input Delay):', `${this.metrics.fid.toFixed(0)}ms`);
    console.log('CLS (Cumulative Layout Shift):', this.metrics.cls.toFixed(3));
    console.log('FCP (First Contentful Paint):', `${this.metrics.fcp.toFixed(0)}ms`);
    console.log('TTFB (Time to First Byte):', `${this.metrics.ttfb.toFixed(0)}ms`);
    console.log('INP (Interaction to Next Paint):', `${this.metrics.inp.toFixed(0)}ms`);
    console.groupEnd();
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

export function measureAsyncOperation<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  return operation().then(
    (result) => {
      const duration = performance.now() - startTime;
      if (isDevelopment) {
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      }
      return result;
    },
    (error) => {
      const duration = performance.now() - startTime;
      console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  );
}

export function measureSyncOperation<T>(
  name: string,
  operation: () => T
): T {
  const startTime = performance.now();
  
  try {
    const result = operation();
    const duration = performance.now() - startTime;
    if (isDevelopment) {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

export function createTimingBoundary(name: string): {
  end: () => number;
} {
  const startTime = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - startTime;
      if (isDevelopment) {
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      }
      return duration;
    }
  };
}
