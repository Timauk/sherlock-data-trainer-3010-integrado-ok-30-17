-- Executar todos os scripts de migração em ordem

-- 1. Initial Schema
BEGIN;
-- ... keep existing code (from 20240000000000_initial_schema.sql)

-- 2. Webhooks and Lineage
-- ... keep existing code (from 20240000000001_webhooks_and_lineage.sql)

-- 3. Advanced Analysis
-- ... keep existing code (from 20240000000002_advanced_analysis.sql)

-- 4. Trained Models
-- ... keep existing code (from 20240000000003_trained_models.sql)

-- Verify tables were created
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'historical_games') THEN
        RAISE EXCEPTION 'Table historical_games not created';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'players') THEN
        RAISE EXCEPTION 'Table players not created';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'predictions') THEN
        RAISE EXCEPTION 'Table predictions not created';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'performance_metrics') THEN
        RAISE EXCEPTION 'Table performance_metrics not created';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'webhooks') THEN
        RAISE EXCEPTION 'Table webhooks not created';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'trained_models') THEN
        RAISE EXCEPTION 'Table trained_models not created';
    END IF;
    RAISE NOTICE 'All tables created successfully';
END $$;

COMMIT;