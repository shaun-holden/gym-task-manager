const colorMap = {
  CLEANING: 'bg-green-100 text-green-800',
  EQUIPMENT_MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  FRONT_DESK: 'bg-blue-100 text-blue-800',
  CLASSES: 'bg-purple-100 text-purple-800',
  SAFETY: 'bg-red-100 text-red-800',
  OTHER: 'bg-gray-100 text-gray-800',
  ADMIN: 'bg-red-100 text-red-800',
  SUPERVISOR: 'bg-blue-100 text-blue-800',
  EMPLOYEE: 'bg-green-100 text-green-800',
};

const labelMap = {
  EQUIPMENT_MAINTENANCE: 'Equipment',
  FRONT_DESK: 'Front Desk',
};

export default function Badge({ value }) {
  const color = colorMap[value] || 'bg-gray-100 text-gray-800';
  const label = labelMap[value] || value?.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${color}`}>
      {label?.toLowerCase()}
    </span>
  );
}
