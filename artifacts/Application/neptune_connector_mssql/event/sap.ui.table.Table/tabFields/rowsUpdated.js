let binding = tabFields.getBinding("rows");
if (!binding) return;

tabDetailFields.setCount(binding.getLength());

//const filter = new sap.ui.model.Filter("type", "EQ", "P ");
const isProcedure = modeloPageDetail.oData.config.isProcedure;
console.log(isProcedure);


if (isProcedure == true) {
    coltabFieldsIcon.setVisible(true);
} else {
    coltabFieldsIcon.setVisible(false);
}






