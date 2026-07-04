"use client";

import { useParams } from "next/navigation";
import { CollectionForm } from "@/components/admin/collection-form";

export default function EditCollectionPage() {
  const params = useParams();
  const id = params.id as string;
  return <CollectionForm collectionId={id} />;
}
