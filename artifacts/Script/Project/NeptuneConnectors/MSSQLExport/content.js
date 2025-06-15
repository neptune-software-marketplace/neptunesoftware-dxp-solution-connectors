if (!req.query.dbid) {
    result.data = { error: "Please select database connection string" };
    return complete();
}

if (!req.query.table) {
    result.data = { error: "Please select database table" };
    return complete();
}

const skip = req.query?.skip || 0;

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
        query = `select * from ${req.query.table} order by ${req.query.orderBy} offset ${skip} rows fetch next ${req.query.take} rows only`;
    }
    let res = await globals.Utils.MSSQLExec(req.query.dbid, query);

    result.data = res.recordset;
    complete();
} catch (error) {
    log.error("Error in request: ", error);
    return fail();
}
