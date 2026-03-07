"use client";

import { useParams } from "next/navigation";
import { ProjectReviewForm } from "../../../components/ProjectReviewForm";

export default function AdminBlogEditProjectReviewPage() {
  const params = useParams();
  const id = params.id as string;

  return <ProjectReviewForm mode="edit" id={id} />;
}
