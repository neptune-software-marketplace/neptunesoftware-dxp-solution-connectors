if (!req.query.dbid) {
    result.data = { error: "Please select database connection string" };
    return complete();
}

if (!req.query.table) {
    result.data = { error: "Please select database table" };
    return complete();
}

try {
    let query = `select col.name,
    col.object_id,
    typ.name as type,
    col.max_length,
    col.is_identity,
    prop.value as description
    from sys.columns as col    
    left join sys.tables as tab on tab.object_id = col.object_id
    left join sys.extended_properties as prop on prop.major_id = col.object_id and prop.minor_id = col.column_id and prop.name = 'MS_Description'
    left join sys.types as typ on typ.system_type_id = col.system_type_id and typ.user_type_id = col.user_type_id
    where tab.name = '${req.query.table}'
    order by name`;

    let res = await globals.Utils.MSSQLExec(req.query.dbid, query);

    if (res.error) {
        result.data = res;
        return complete();
    }

    if (!res.recordset.length) {
        query = `select col.name,
    col.object_id,
    typ.name as type,
    col.max_length,
    col.is_identity,
    prop.value as description
    from sys.columns as col    
    left join sys.views as tab on tab.object_id = col.object_id
    left join sys.extended_properties as prop on prop.major_id = col.object_id and prop.minor_id = col.column_id and prop.name = 'MS_Description'
    left join sys.types as typ on typ.system_type_id = col.system_type_id and typ.user_type_id = col.user_type_id
    where tab.name = '${req.query.table}'
    order by name`;

        res = await globals.Utils.MSSQLExec(req.query.dbid, query);
    }

    if (!res.recordset.length) {
        // Get stored procedure parameters
        query = `select 
        p.name,
        p.object_id,
        t.name as type,
        p.max_length,
        0 as is_identity, 
        ep.value as description,
        p.is_output
    from sys.parameters as p
    left join sys.procedures sp on p.object_id = sp.object_id
    left join sys.types t on p.system_type_id = t.system_type_id and p.user_type_id = t.user_type_id
    left join sys.extended_properties ep on ep.major_id = p.object_id and ep.minor_id = p.parameter_id and ep.name = 'MS_Description'
    where sp.name = '${req.query.table}'
    order by p.parameter_id`;

        res = await globals.Utils.MSSQLExec(req.query.dbid, query);

        // Get result set columns of the stored procedure
        const procName = req.query.table;
        const cquery = `select 
        name,
        system_type_name as type,
        max_length,
        is_identity_column as is_identity,
        null as description,
        null as object_id,
        1 as is_output
    from sys.dm_exec_describe_first_result_set(
        N'EXEC ${procName}', null, 0
    )
    where name is not null;`;

        const cres = await globals.Utils.MSSQLExec(req.query.dbid, cquery);

        // Combine parameters with result set columns
        if (!cres.error && cres.recordset && cres.recordset.length > 0) {
            if (res.recordset && res.recordset.length > 0) {
                res.recordset = [...res.recordset, ...cres.recordset];
            } else {
                res = cres;
            }
        }
        // Convert is_output and is_identity to boolean
        if (res.recordset) {
            res.recordset = res.recordset.map((r) => ({
                ...r,
                is_output: r.is_output === 1 || r.is_output === true,
                is_identity: r.is_identity === 1 || r.is_identity === true,
            }));
        }
    }

    if (res.error) {
        result.data = res;
        return complete();
    }

    result.data = res.recordset;
    complete();
} catch (error) {
    log.error("Error in request: ", error);
    return fail();
}
