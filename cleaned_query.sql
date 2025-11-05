-- ============================================================================
-- Openreach NOI Infrastructure Query
-- ============================================================================
-- Purpose: Retrieves NOI data with associated poles, manholes, and underground
--          structures along with their node designations and network areas
-- ============================================================================

SELECT
    -- Object Identification
    COALESCE(p.source_id, m.source_id, u.source_id) AS object_id,
    oritem.resource_type AS object_type,

    -- NOI Information
    ornoi.or_identifier,
    ornoi.status,
    ornoi.expiry_date,

    -- Structure Information
    COALESCE(p.model, m.model, u.model) AS structure_model,
    COALESCE(p.designation, m.designation, u.designation) AS structure_designation,
    COALESCE(p.status, m.status, u.status) AS structure_status,

    -- Designation (from node or network area)
    CASE
        WHEN n.designation IS NOT NULL THEN n.designation
        ELSE na.name
    END AS designation,

    -- Structure Type Classification
    CASE
        WHEN n.model = 'asn_node' THEN 'ASN'
        WHEN n.model = 'udp_node' THEN 'USN'
        WHEN n.model = 'primary_node' THEN 'PN'
        WHEN n.model = 'sc_node' THEN 'JC'
        WHEN n.model = 'cdc_node' THEN 'CDC'
        WHEN n.model = 'ac_node' THEN 'AC'
        WHEN n.model = 'mdu_bep_node' THEN 'MDU'
        WHEN n.model IS NULL AND n.designation IS NULL AND oritem.resource_type = 'manhole' THEN 'Pass Through Chamber'
        WHEN n.model IS NULL AND n.designation IS NULL AND oritem.resource_type = 'pole' THEN 'Pass Through Pole'
        ELSE n.model
    END AS structure_type,

    -- Geometry (with SRID 27700 - British National Grid)
    COALESCE(ST_SetSRID(p.geom, 27700), ST_SetSRID(m.geom, 27700)) AS geom

FROM
    ksavi_ni_telco.openreach_noi ornoi

    -- NOI Route Items (links NOI to infrastructure objects)
    LEFT JOIN ksavi_ni_telco.openreach_noi_route_item oritem
        ON oritem.openreach_noi_id = ornoi.id

    -- Infrastructure Objects (Poles, Manholes, Underground)
    LEFT JOIN ksavi_ni_telco.pole p
        ON p.source_id::text = oritem.resource_id
    LEFT JOIN ksavi_ni_telco.manhole m
        ON m.source_id::text = oritem.resource_id
    LEFT JOIN ksavi_ni_telco.underground u
        ON u.source_id::text = oritem.resource_id

    -- Node Information (equipment at structures)
    LEFT JOIN ksavi_ni_telco.node n
        ON n.structure_id = oritem.resource_id

    -- Network Area (spatial join for area designation)
    LEFT JOIN ksavi_ni_telco.network_area na
        ON COALESCE(ST_Within(p.geom, na.geom), ST_Within(m.geom, na.geom))
        AND na.type = 'primarySplitterCoverage'
        -- Other area types available:
        -- 'CDCLeg'
        -- 'acarea'
        -- 'accessArea'

WHERE
    -- Ensure we have a valid infrastructure object
    COALESCE(p.id, m.id, u.id) IS NOT NULL

    -- Exclude underground resource types from results
    AND oritem.resource_type <> 'underground'

    -- Exclude pot nodes (or allow if node is null)
    AND (n.model <> 'pot_node' OR n.model IS NULL)

    -- =========================================================================
    -- FILTERING OPTIONS (Choose one method below)
    -- =========================================================================

    -- OPTION 1: Filter by specific designations (IN clause)
    -- Use this when you have a small list of designations to search
    AND COALESCE(p.designation, m.designation, u.designation) IN (
        'JC:JRF:L8999738'
        -- Add more designations here, comma-separated
    )

    -- OPTION 2: Filter using existing lookup table
    -- Use this when you have many designations in a table
    -- Uncomment the section below and comment out OPTION 1
    /*
    AND EXISTS (
        SELECT 1
        FROM public.xl_pianoi100096313725 xl
        WHERE xl."Designation" = COALESCE(p.designation, m.designation, u.designation)
    )
    */

    -- OPTION 3: Filter by specific NOI identifier
    -- Uncomment to search for a specific NOI
    -- AND ornoi.or_identifier = 'PIANOI100096313725'

    -- OPTION 4: Filter by NOI status
    -- Uncomment to exclude completed NOIs
    -- AND ornoi.status <> 'NoI Complete'

    -- OPTION 5: Filter by audit file
    -- Uncomment both the audit table JOIN above and this filter
    -- AND a."Designation" IS NOT NULL

ORDER BY
    object_type,
    or_identifier,
    structure_status,
    structure_type;


-- ============================================================================
-- OPTIONAL: Aggregate Results
-- ============================================================================
-- Uncomment to get counts by object type:
/*
WITH cte AS (
    -- Paste the main query here
)
SELECT
    object_type,
    COUNT(object_id) AS object_count
FROM cte
GROUP BY object_type;
*/
