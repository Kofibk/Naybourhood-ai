"use client";

import { useMemo, useState, useEffect } from "react";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/contexts/AuthContext";
import {
  ConversationsView,
  ConversationsEmptyCompany,
} from "@/components/ConversationsView";

export default function AgentConversationsPage() {
  const [page, setPage] = useState(0);
  const { leads, isLoading } = useLeads(page, 20);
  const { user, isLoading: authLoading } = useAuth();

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  // Filter leads by company_id
  const myLeads = useMemo(() => {
    const data = leads?.data || [];
    if (!user?.company_id) return { data, count: leads?.count || 0 };
    return {
      data: data.filter((lead) => lead.company_id === user.company_id),
      count: leads?.count || 0,
    };
  }, [leads, user?.company_id]);

  // Show loading while auth initializes
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show message if not assigned to company (only after auth loaded)
  if (!user?.company_id) {
    return (
      <ConversationsEmptyCompany
        title="Conversations"
        subtitle="Manage buyer communications"
      />
    );
  }

  return (
    <ConversationsView
      leads={myLeads}
      source="leads"
      isLoading={isLoading}
      currentPage={page}
      onPageChange={setPage}
      basePath="/agent"
      title="Conversations"
      subtitle="Manage buyer communications"
      emptyMessage="No conversations with buyers yet"
    />
  );
}
