if (!req.query.dbid) {
    result.data = { error: "Please select database connection string" };
    return complete();
}

if (!req.query.schema_id) {
    result.data = { error: "Please select database schema" };
    return complete();
}

try {
    const queryTable = `select tab.name, 
    type,
    tab.object_id,
    tab.modify_date,
    prop.value as description
    from sys.tables as tab    
    left join sys.extended_properties as prop on prop.major_id = tab.object_id and prop.minor_id = '0' and prop.name = 'MS_Description'
    where schema_id = '${req.query.schema_id}'
    `;

    const resTable = await globals.Utils.MSSQLExec(req.query.dbid, queryTable);

    if (resTable.error) {
        result.data = resTable;
        return complete();
    }

    const queryView = `select tab.name,
    type,
    tab.object_id,
    tab.modify_date,
    prop.value as description
    from sys.views as tab    
    left join sys.extended_properties as prop on prop.major_id = tab.object_id and prop.minor_id = '0' and prop.name = 'MS_Description'
    where schema_id = '${req.query.schema_id}' 
    `;

    const resView = await globals.Utils.MSSQLExec(req.query.dbid, queryView);

    if (resView.error) {
        result.data = resView;
        return complete();
    }

    const queryProcedure = `
    select p.name, p.object_id, p.modify_date, prop.value as description, type
    from sys.procedures as p
    left join sys.extended_properties as prop
        on prop.major_id = p.object_id
        and prop.minor_id = '0'
        and prop.name = 'MS_Description'
    where schema_id = '${req.query.schema_id}'
    `;

    const resProcedure = await globals.Utils.MSSQLExec(req.query.dbid, queryProcedure);
  
    if (resProcedure.error) {
        result.data = resProcedure; 
        return complete();
    }

    // Combine results from tables, views, and procedures
    let data = resTable.recordset.concat(resView.recordset);
    data = data.concat(resProcedure.recordset);
    result.data = data.sort(globals.Utils.SortBy("name"));
    complete();
} catch (error) {
    log.error("Error in request: ", error);
    return fail();
}
