CREATE POLICY "Users can delete own documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);