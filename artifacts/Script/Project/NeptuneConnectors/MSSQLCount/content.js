if (!req.query.dbid) {
    result.data = { error: "Please select database connection string" };
    return complete();
}

if (!req.query.table) {
    result.data = { error: "Please select database table" };
    return complete();
}

//Get connecotr
const connector = await entities.neptune_af_connector.findOne({
    select: ["config", "systemid"],
    where: { id: req.query.id },
});

try {
    let query;
    if (connector?.config.isProcedure) {
        query = `EXEC ${connector.config.schema}.${connector.config.table} ${procedureParams}`;
    } else {
        query = `select count(*) as count from ${req.query.table}`;
    }

    let res = await globals.Utils.MSSQLExec(req.query.dbid, query);

    result.data = {
        db: res.recordset[0].count,
    };
    complete();
} catch (error) {
    log.error("Error in request: ", error);
    return fail();
}
