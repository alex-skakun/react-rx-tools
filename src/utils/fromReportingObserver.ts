import { NEVER, Observable, share } from 'rxjs';
import { LiteralUnion, OverrideProperties } from 'value-guards';

export type ReportType = LiteralUnion<
  'coep' | 'coop' | 'csp-violation' | 'deprecation' | 'integrity-violation' | 'intervention' | 'permissions-policy-violation',
  string
>;

export type TypedReport = OverrideProperties<Report, {
  type: ReportType;
}>;

export type COEPViolationReport = OverrideProperties<TypedReport, {
  type: 'coep';
  body: ReportBody & {
    type: LiteralUnion<'corp' | 'navigation' | 'worker initialization', string>;
    disposition: LiteralUnion<'enforce' | 'reporting', string>;
    destination: LiteralUnion<Request['destination'], string>;
    blockedURL: string;
  };
}>;

export type COOPViolationReport = OverrideProperties<TypedReport, {
  type: 'coop';
}>;

export type CSPViolationReport = OverrideProperties<TypedReport, {
  type: 'csp-violation';
  body: CSPViolationReportBody;
}>;

export type DeprecationReport = OverrideProperties<TypedReport, {
  type: 'deprecation';
  body: ReportBody & {
    id: string;
    anticipatedRemoval: Date | null;
    message: string;
    sourceFile: string | null;
    lineNumber: number | null;
    columnNumber: number | null;
  };
}>;

export type IntegrityViolationReport = OverrideProperties<TypedReport, {
  type: 'integrity-violation';
  body: ReportBody & {
    blockedURL: string;
    documentURL: string;
    destination: LiteralUnion<Request['destination'], string>;
    reportOnly: boolean;
  };
}>;

export type InterventionReport = OverrideProperties<TypedReport, {
  type: 'intervention';
  body: ReportBody & {
    id: string;
    message: string;
    sourceFile: string | null;
    lineNumber: number | null;
    columnNumber: number | null;
  };
}>;

export type PermissionPolicyViolationReport = OverrideProperties<TypedReport, {
  type: 'permissions-policy-violation';
  body: ReportBody & {
    disposition: LiteralUnion<'enforce' | 'report', string>;
    featureId: string;
    message: string;
    sourceFile: string | null;
    lineNumber: number | null;
    columnNumber: number | null;
  };
}>;

export function fromReportingObserver(reportTypes: ['coep']): Observable<COEPViolationReport>;
export function fromReportingObserver(reportTypes: ['coop']): Observable<COOPViolationReport>;
export function fromReportingObserver(reportTypes: ['csp-violation']): Observable<CSPViolationReport>;
export function fromReportingObserver(reportTypes: ['deprecation']): Observable<DeprecationReport>;
export function fromReportingObserver(reportTypes: ['integrity-violation']): Observable<IntegrityViolationReport>;
export function fromReportingObserver(reportTypes: ['intervention']): Observable<InterventionReport>;
export function fromReportingObserver(reportTypes: ['permissions-policy-violation']): Observable<PermissionPolicyViolationReport>;
export function fromReportingObserver(reportTypes: ReportType[]): Observable<TypedReport>;

export function fromReportingObserver(reportTypes: ReportType[]): Observable<TypedReport> {
  if (!('ReportingObserver' in globalThis)) {
    return NEVER;
  }
  return new Observable<TypedReport>((subscriber) => {
    const typesFilter = new Set(reportTypes);
    const reportingObserver = new ReportingObserver((entries) => {
      entries.forEach((report) => {
        if (typesFilter.has(report.type)) {
          subscriber.next(report);
        }
      });
    }, {
      types: reportTypes,
      buffered: true,
    });

    reportingObserver.observe();

    return () => {
      reportingObserver.disconnect();
    };
  }).pipe(
    share(),
  );
}
