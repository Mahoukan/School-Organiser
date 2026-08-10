import ClassDetail from "../../../components/classes/ClassDetail";

export default async function ClassDetailPage({ params }) {
  const { classId } = await params;
  return <ClassDetail classId={classId} />;
}
