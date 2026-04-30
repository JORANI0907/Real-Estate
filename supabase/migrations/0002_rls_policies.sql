-- properties: 로그인 사용자 모두 읽기 가능
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "properties_read_all_authenticated"
ON properties FOR SELECT
TO authenticated
USING (true);

-- legal_analysis: 동일
ALTER TABLE legal_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "legal_analysis_read_all_authenticated"
ON legal_analysis FOR SELECT
TO authenticated
USING (true);

-- favorites: 본인 것만 접근 가능
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_own"
ON favorites FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "favorites_insert_own"
ON favorites FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_update_own"
ON favorites FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "favorites_delete_own"
ON favorites FOR DELETE
TO authenticated
USING (user_id = auth.uid());
