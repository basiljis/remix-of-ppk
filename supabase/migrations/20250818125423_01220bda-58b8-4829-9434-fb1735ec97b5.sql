-- Update existing protocols without ppk_number to have auto-generated numbers
UPDATE protocols 
SET ppk_number = generate_protocol_number(),
    sequence_number = (
      SELECT row_number() OVER (ORDER BY created_at) 
      FROM protocols p2 
      WHERE p2.id = protocols.id
    )
WHERE ppk_number IS NULL OR ppk_number = '';