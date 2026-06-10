import { InspectionJobStatus } from 'src/inspection-jobs/enums/inspection-job-status.enum';

export const JOB_STATUSES_BLOCKING_UNASSIGN: InspectionJobStatus[] = [
  InspectionJobStatus.Locked,
  InspectionJobStatus.Completed,
  InspectionJobStatus.Cancelled,
];
