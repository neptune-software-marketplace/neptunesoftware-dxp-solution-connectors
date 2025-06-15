if (!req.query.dbid) {
    result.data = { error: "Please select database connection string" };
    return complete();
}

//Get connecotr
const connector = await entities.neptune_af_connector.findOne({
    select: ["config", "systemid"],
    where: { id: req.query.dbid },
});

try {
    let query;
    if (connector?.config.isProcedure) {
        query = `EXEC ${connector.config.schema}.${connector.config.table} ${procedureParams}`;
    } else {
        query = `select * from sys.schemas order by name`;
    }
    
    const res = await globals.Utils.MSSQLExec(req.query.dbid, query);

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
