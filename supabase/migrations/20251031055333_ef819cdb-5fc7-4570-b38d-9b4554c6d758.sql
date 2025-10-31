-- Create storage bucket for protocol documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('protocol-documents', 'protocol-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create policies for protocol documents bucket
CREATE POLICY "Authenticated users can view protocol documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'protocol-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload protocol documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'protocol-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their protocol documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'protocol-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their protocol documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'protocol-documents' AND auth.uid() IS NOT NULL);