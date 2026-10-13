export interface StatisticalClassifiers {
  id: string;
  number: string;
  classificationName: string;
  internationalAnalogue: string;
  approvalDocument: string;
  implementationDate: string;
  status: 'active' | 'pending' | 'updated';
}