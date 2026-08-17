// Shared source of truth for personnel qualifications.
//
// `qualification` is stored as free-text in the backend, so this list is only
// used to populate dropdowns. Keeping it in one place guarantees every screen
// (Personnel, AddPersonnel, PersonnelProfile) shows the same key/label pairs
// and that any future addition is reflected everywhere at once.
//
// `value` is what gets persisted; `label` is what is displayed.
export const QUALIFICATIONS = [
  { label: 'PhD Holder', value: 'PHD' },
  { label: 'MSc / MA', value: 'MSC_MA' },
  { label: 'M.Ed', value: 'MED' },
  { label: 'MSc.Ed', value: 'MSC_ED' },
  { label: 'MA.Ed', value: 'MA_ED' },
  { label: 'BSc / BA', value: 'BSC_BA' },
  { label: 'BSc.Ed', value: 'BSC_ED' },
  { label: 'BA.Ed', value: 'BA_ED' },
  { label: 'HND', value: 'HND' },
  { label: 'PgD Edu', value: 'PGD_EDU' },
  { label: 'NCE', value: 'NCE' },
  { label: 'OND', value: 'OND' },
  { label: 'SSCE', value: 'SSCE' },
  { label: 'Grade II', value: 'GRADE_II' },
  { label: 'Other', value: 'OTHER' },
];

export default QUALIFICATIONS;
