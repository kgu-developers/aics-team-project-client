// Enrollment is independent of both global and section roles, like the backend.
// These synthetic relationships match the enrolled demo student accounts.
const enrollments = [
  { studentNumber: '20260001', sectionId: 1, status: 'ACTIVE' },
  { studentNumber: '20260003', sectionId: 1, status: 'ACTIVE' },
  { studentNumber: '20260004', sectionId: 1, status: 'ACTIVE' },
  { studentNumber: '20260021', sectionId: 2, status: 'ACTIVE' },
];

export function getMockEnrollments(studentNumber: string) {
  return enrollments.filter(item => item.studentNumber === studentNumber);
}
