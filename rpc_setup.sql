CREATE OR REPLACE FUNCTION acquire_card_lock(
  p_card_id UUID, 
  p_user_id UUID,
  p_timeout_minutes INT
) RETURNS BOOLEAN AS $$
DECLARE
  v_locked_by UUID;
  v_locked_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT locked_by, locked_at INTO v_locked_by, v_locked_at
  FROM investigation_cards
  WHERE id = p_card_id
  FOR UPDATE;

  IF v_locked_by IS NULL OR (v_locked_at < NOW() - (p_timeout_minutes || ' minutes')::INTERVAL) THEN
    UPDATE investigation_cards
    SET locked_by = p_user_id, locked_at = NOW()
    WHERE id = p_card_id;
    RETURN TRUE;
  ELSIF v_locked_by = p_user_id THEN
    UPDATE investigation_cards
    SET locked_at = NOW()
    WHERE id = p_card_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Altere a tabela se precisar:
-- ALTER TABLE investigation_cards ADD COLUMN IF NOT EXISTS locked_by UUID;
-- ALTER TABLE investigation_cards ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
