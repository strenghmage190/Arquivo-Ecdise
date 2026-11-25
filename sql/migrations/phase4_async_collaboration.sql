-- Phase 4: Async Collaboration (Pins, Findings, Dedicated Card Status)
-- Ensures case_card_status lives in its own table (not investigation_cards.metadata),
-- sets DEFAULT auth.uid() on author columns, and enforces member + author RLS.

CREATE TABLE IF NOT EXISTS public.case_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  card_id UUID REFERENCES public.investigation_cards(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('board', 'acoustic', 'document', 'phone')),
  anchor_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  tag TEXT NOT NULL CHECK (tag IN ('suspect', 'code', 'look_here', 'contradiction', 'question')),
  note TEXT NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID,
  created_by UUID DEFAULT auth.uid(),
  author_name TEXT NOT NULL DEFAULT 'Agente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.case_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('code', 'person', 'date', 'location', 'theory')),
  label TEXT NOT NULL,
  details TEXT,
  source_card_id UUID REFERENCES public.investigation_cards(id) ON DELETE SET NULL,
  source_tool TEXT CHECK (source_tool IN ('board', 'acoustic', 'document', 'phone', 'manual')),
  source_anchor JSONB DEFAULT '{}'::jsonb,
  created_by UUID DEFAULT auth.uid(),
  author_name TEXT NOT NULL DEFAULT 'Agente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.case_card_status (
  investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.investigation_cards(id) ON DELETE CASCADE,
  team_status TEXT NOT NULL DEFAULT 'unexplored' CHECK (team_status IN ('unexplored', 'has_clue', 'stuck', 'exhausted')),
  updated_by UUID DEFAULT auth.uid(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (investigation_id, card_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_case_pins_investigation ON public.case_pins(investigation_id);
CREATE INDEX IF NOT EXISTS idx_case_pins_card ON public.case_pins(card_id);
CREATE INDEX IF NOT EXISTS idx_case_findings_investigation ON public.case_findings(investigation_id);
CREATE INDEX IF NOT EXISTS idx_case_card_status_investigation ON public.case_card_status(investigation_id);

-- Enable Row Level Security
ALTER TABLE public.case_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_card_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies: case_pins
DROP POLICY IF EXISTS "case_pins_member_select" ON public.case_pins;
CREATE POLICY "case_pins_member_select" ON public.case_pins
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id)
  );

DROP POLICY IF EXISTS "case_pins_member_insert" ON public.case_pins;
CREATE POLICY "case_pins_member_insert" ON public.case_pins
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id)
  );

DROP POLICY IF EXISTS "case_pins_member_update" ON public.case_pins;
CREATE POLICY "case_pins_member_update" ON public.case_pins
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id)
  );

DROP POLICY IF EXISTS "case_pins_author_or_gm_delete" ON public.case_pins;
CREATE POLICY "case_pins_author_or_gm_delete" ON public.case_pins
  FOR DELETE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.investigations i
      WHERE i.id = investigation_id AND i.owner_id = auth.uid()
    )
  );

-- RLS Policies: case_findings (author UPDATE + member SELECT/INSERT)
DROP POLICY IF EXISTS "case_findings_member_select" ON public.case_findings;
CREATE POLICY "case_findings_member_select" ON public.case_findings
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id)
  );

DROP POLICY IF EXISTS "case_findings_member_insert" ON public.case_findings;
CREATE POLICY "case_findings_member_insert" ON public.case_findings
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id)
  );

DROP POLICY IF EXISTS "case_findings_author_or_gm_update" ON public.case_findings;
CREATE POLICY "case_findings_author_or_gm_update" ON public.case_findings
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.investigations i
      WHERE i.id = investigation_id AND i.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "case_findings_author_or_gm_delete" ON public.case_findings;
CREATE POLICY "case_findings_author_or_gm_delete" ON public.case_findings
  FOR DELETE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.investigations i
      WHERE i.id = investigation_id AND i.owner_id = auth.uid()
    )
  );

-- RLS Policies: case_card_status (dedicated table with member RLS)
DROP POLICY IF EXISTS "case_card_status_member_select" ON public.case_card_status;
CREATE POLICY "case_card_status_member_select" ON public.case_card_status
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id)
  );

DROP POLICY IF EXISTS "case_card_status_member_insert" ON public.case_card_status;
CREATE POLICY "case_card_status_member_insert" ON public.case_card_status
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id)
  );

DROP POLICY IF EXISTS "case_card_status_member_update" ON public.case_card_status;
CREATE POLICY "case_card_status_member_update" ON public.case_card_status
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id)
  );

DROP POLICY IF EXISTS "case_card_status_gm_delete" ON public.case_card_status;
CREATE POLICY "case_card_status_gm_delete" ON public.case_card_status
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.investigations i
      WHERE i.id = investigation_id AND i.owner_id = auth.uid()
    )
  );

-- Realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'case_pins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.case_pins;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'case_findings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.case_findings;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'case_card_status'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.case_card_status;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
