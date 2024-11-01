-- Create statistical analysis views
CREATE MATERIALIZED VIEW IF NOT EXISTS number_frequency_analysis AS
SELECT 
    number,
    COUNT(*) as frequency,
    COUNT(*) / CAST((SELECT COUNT(*) FROM historical_games) as float) as probability
FROM historical_games, unnest(numeros) as number
GROUP BY number;

CREATE MATERIALIZED VIEW IF NOT EXISTS pattern_analysis AS
SELECT 
    array_agg(n ORDER BY n) as pattern,
    COUNT(*) as frequency
FROM historical_games,
     unnest(numeros) as n
GROUP BY concurso
HAVING COUNT(*) > 1;

-- Create machine learning functions
CREATE OR REPLACE FUNCTION train_prediction_model(
    training_data jsonb,
    model_params jsonb
) RETURNS void AS $$
BEGIN
    -- Implementation using pgml extension
    -- Note: Requires PostgreSQL with pgml extension
    PERFORM pgml.train(
        'prediction_model',
        'regression',
        'historical_games',
        'next_numbers',
        model_params
    );
END;
$$ LANGUAGE plpgsql;

-- Create recommendation system
CREATE OR REPLACE FUNCTION get_player_recommendations(
    player_id BIGINT
) RETURNS TABLE (
    recommendation text,
    confidence float
) AS $$
BEGIN
    RETURN QUERY
    WITH player_stats AS (
        SELECT 
            p.id,
            AVG(pm.accuracy) as avg_accuracy,
            jsonb_path_query_array(p.dna, '$.weights') as weights
        FROM players p
        LEFT JOIN performance_metrics pm ON p.id = pm.player_id
        WHERE p.id = player_id
        GROUP BY p.id, p.dna
    ),
    similar_players AS (
        SELECT 
            p2.id,
            AVG(pm2.accuracy) as accuracy
        FROM players p2
        LEFT JOIN performance_metrics pm2 ON p2.id = pm2.player_id
        WHERE p2.id != player_id
        GROUP BY p2.id
        ORDER BY ABS(
            (SELECT avg_accuracy FROM player_stats) - AVG(pm2.accuracy)
        )
        LIMIT 5
    )
    SELECT 
        'Baseado em jogadores similares: ' || string_agg(pred.numbers::text, ', '),
        AVG(pred.confidence)::float
    FROM similar_players sp
    JOIN predictions pred ON pred.player_id = sp.id
    GROUP BY pred.numbers;
END;
$$ LANGUAGE plpgsql;

-- Create real-time metrics function
CREATE OR REPLACE FUNCTION get_realtime_metrics()
RETURNS TABLE (
    accuracy float,
    confidence float,
    trend text
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_metrics AS (
        SELECT 
            pm.accuracy,
            pm.timestamp,
            LAG(pm.accuracy) OVER (ORDER BY pm.timestamp) as prev_accuracy
        FROM performance_metrics pm
        WHERE pm.timestamp >= NOW() - INTERVAL '1 hour'
        ORDER BY pm.timestamp DESC
        LIMIT 100
    )
    SELECT 
        AVG(accuracy)::float,
        STDDEV(accuracy)::float,
        CASE 
            WHEN AVG(accuracy - COALESCE(prev_accuracy, accuracy)) > 0 THEN 'up'
            WHEN AVG(accuracy - COALESCE(prev_accuracy, accuracy)) < 0 THEN 'down'
            ELSE 'stable'
        END
    FROM recent_metrics;
END;
$$ LANGUAGE plpgsql;

-- Create refresh function for materialized views
CREATE OR REPLACE FUNCTION refresh_analysis_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY number_frequency_analysis;
    REFRESH MATERIALIZED VIEW CONCURRENTLY pattern_analysis;
END;
$$ LANGUAGE plpgsql;

-- Schedule regular refresh of materialized views
SELECT cron.schedule(
    'refresh_analysis_views_job',
    '0 */1 * * *',  -- Every hour
    'SELECT refresh_analysis_views()'
);