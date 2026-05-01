/**
 * Database types — riflettono lo schema in db/01_schema.sql.
 *
 * Quando lo schema cambia, aggiorna questo file (a mano, oppure usa
 *   `supabase gen types typescript --project-id <id> > src/lib/database.types.ts`
 * dopo aver installato la CLI).
 */

export type GlobalRole = "superadmin" | "user";
export type WorkspaceStatus = "active" | "trial" | "paused" | "suspended";
export type Plan = "free" | "starter" | "growth" | "scale" | "enterprise";
export type MemberRole = "admin" | "staff";
export type ProjectMemberRole = "viewer" | "editor";
export type ProjectStatus = "live" | "draft" | "deploying" | "archived";
export type ActivityType =
  | "deploy" | "invite" | "domain" | "billing"
  | "alert" | "create" | "update" | "delete" | "login";
export type LeadStatus = "new" | "contacted" | "won" | "lost";

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_color: string;
          global_role: GlobalRole;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          avatar_color?: string;
          global_role?: GlobalRole;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_color?: string;
          global_role?: GlobalRole;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          status: WorkspaceStatus;
          plan: Plan;
          badge: string | null;
          monthly_revenue: number;
          storage_mb: number;
          storage_limit_mb: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id: string;
          status?: WorkspaceStatus;
          plan?: Plan;
          badge?: string | null;
          monthly_revenue?: number;
          storage_mb?: number;
          storage_limit_mb?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          owner_id?: string;
          status?: WorkspaceStatus;
          plan?: Plan;
          badge?: string | null;
          monthly_revenue?: number;
          storage_mb?: number;
          storage_limit_mb?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: MemberRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: MemberRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: MemberRole;
          created_at?: string;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: ProjectMemberRole;
          invited_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: ProjectMemberRole;
          invited_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role?: ProjectMemberRole;
          invited_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          slug: string;
          category: string;
          status: ProjectStatus;
          subdomain: string;
          custom_domain: string | null;
          visits_30d: number;
          leads_30d: number;
          revenue_30d: number;
          tech_stack: string[];
          last_deploy_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          slug: string;
          category?: string;
          status?: ProjectStatus;
          subdomain: string;
          custom_domain?: string | null;
          visits_30d?: number;
          leads_30d?: number;
          revenue_30d?: number;
          tech_stack?: string[];
          last_deploy_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          slug?: string;
          category?: string;
          status?: ProjectStatus;
          subdomain?: string;
          custom_domain?: string | null;
          visits_30d?: number;
          leads_30d?: number;
          revenue_30d?: number;
          tech_stack?: string[];
          last_deploy_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_pages: {
        Row: {
          id: string;
          project_id: string;
          slug: string;
          title: string;
          content: Record<string, unknown>;
          seo: Record<string, unknown>;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          slug: string;
          title: string;
          content?: Record<string, unknown>;
          seo?: Record<string, unknown>;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          slug?: string;
          title?: string;
          content?: Record<string, unknown>;
          seo?: Record<string, unknown>;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_leads: {
        Row: {
          id: string;
          project_id: string;
          email: string | null;
          name: string | null;
          phone: string | null;
          source: string | null;
          data: Record<string, unknown>;
          status: LeadStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          email?: string | null;
          name?: string | null;
          phone?: string | null;
          source?: string | null;
          data?: Record<string, unknown>;
          status?: LeadStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          email?: string | null;
          name?: string | null;
          phone?: string | null;
          source?: string | null;
          data?: Record<string, unknown>;
          status?: LeadStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      activity: {
        Row: {
          id: string;
          workspace_id: string | null;
          project_id: string | null;
          actor_id: string | null;
          type: ActivityType;
          message: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          project_id?: string | null;
          actor_id?: string | null;
          type: ActivityType;
          message: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          project_id?: string | null;
          actor_id?: string | null;
          type?: ActivityType;
          message?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
      invites: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          role: MemberRole;
          invited_by: string | null;
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          role?: MemberRole;
          invited_by?: string | null;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          email?: string;
          role?: MemberRole;
          invited_by?: string | null;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
