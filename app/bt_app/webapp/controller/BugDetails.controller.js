sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    "../model/formatter"
], function (Controller, History, MessageBox, formatter) {
    "use strict";

    return Controller.extend("com.sap.btapp.controller.BugDetails", {
        formatter: formatter, // Include the formatter

        onInit: function () {
            this.getRouter().getRoute("BugDetails").attachPatternMatched(this._onObjectMatched, this);
        },

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        _onObjectMatched: function (oEvent) {
            const sBugId = oEvent.getParameter("arguments").bugId;

            // Bind the view to the bug with the given ID
            this.getView().bindElement({
                path: `/Bugs('${sBugId}')`,
                parameters: {
                    expand: "status,priority" // Expand the navigation properties
                },
                events: {
                    change: function () {
                        console.log("Binding context updated successfully.");
                    },
                    dataRequested: function () {
                        this.getView().setBusy(true);
                    }.bind(this),
                    dataReceived: function () {
                        this.getView().setBusy(false);
                    }.bind(this)
                }
            });
        },

        onNavBack: function () {
            const oHistory = History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getRouter().navTo("Main", {}, true);
            }
        },

        onEditPress: function () {
            if (!this._oEditDialog) {
                this._oEditDialog = new sap.m.Dialog({
                    title: "Edit Bug",
                    contentWidth: "400px", // Set a fixed width for the dialog
                    content: new sap.m.VBox({
                        width: "100%",
                        alignItems: "Center", // Center-align the content
                        justifyContent: "Center",
                        items: [
                            new sap.m.VBox({
                                width: "100%",
                                items: [
                                    new sap.m.Label({ text: "Title", required: true }),
                                    new sap.m.Input({ id: "editTitleInput", value: "{title}", placeholder: "Enter Title", width: "100%" })
                                ]
                            }).addStyleClass("sapUiSmallMarginBottom"),

                            new sap.m.VBox({
                                width: "100%",
                                items: [
                                    new sap.m.Label({ text: "Description" }),
                                    new sap.m.TextArea({ id: "editDescriptionInput", value: "{description}", placeholder: "Enter Description", rows: 4, width: "100%" })
                                ]
                            }).addStyleClass("sapUiSmallMarginBottom"),

                            new sap.m.VBox({
                                width: "100%",
                                items: [
                                    new sap.m.Label({ text: "Status", required: true }),
                                    new sap.m.Select({
                                        id: "editStatusSelect",
                                        width: "100%",
                                        selectedKey: "{status_name}", // Bind to the correct property
                                        items: {
                                            path: "/Statuses",
                                            template: new sap.ui.core.Item({
                                                key: "{name}",
                                                text: "{name}"
                                            })
                                        }
                                    })
                                ]
                            }).addStyleClass("sapUiSmallMarginBottom"),

                            new sap.m.VBox({
                                width: "100%",
                                items: [
                                    new sap.m.Label({ text: "Priority", required: true }),
                                    new sap.m.Select({
                                        id: "editPrioritySelect",
                                        width: "100%",
                                        selectedKey: "{priority_name}", // Bind to the correct property
                                        items: {
                                            path: "/Priorities",
                                            template: new sap.ui.core.Item({
                                                key: "{name}",
                                                text: "{name}"
                                            })
                                        }
                                    })
                                ]
                            }).addStyleClass("sapUiSmallMarginBottom"),

                            new sap.m.VBox({
                                width: "100%",
                                items: [
                                    new sap.m.Label({ text: "Developer ID" }),
                                    new sap.m.Input({ id: "editDeveloperInput", value: "{developer_ID}", placeholder: "Enter Developer ID", width: "100%" })
                                ]
                            }).addStyleClass("sapUiSmallMarginBottom")
                        ]
                    }).addStyleClass("dialog-padding"), // Add custom padding class
                    beginButton: new sap.m.Button({
                        text: "Save",
                        type: "Emphasized",
                        press: this.onSaveEdit.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            this._oEditDialog.close();
                        }.bind(this)
                    })
                });

                // Add the dialog to the view
                this.getView().addDependent(this._oEditDialog);
            }

            // Open the dialog
            this._oEditDialog.open();
        },

        onSaveEdit: function () {
            const oModel = this.getOwnerComponent().getModel(); // Use the OData V4 model from the component
            const oContext = this.getView().getBindingContext();

            // Retrieve updated values from the dialog
            const sTitle = sap.ui.getCore().byId("editTitleInput").getValue();
            const sDescription = sap.ui.getCore().byId("editDescriptionInput").getValue();
            const sStatus = sap.ui.getCore().byId("editStatusSelect").getSelectedKey();
            const sPriority = sap.ui.getCore().byId("editPrioritySelect").getSelectedKey();
            const sDeveloperID = sap.ui.getCore().byId("editDeveloperInput").getValue();

            // Validate mandatory fields
            if (!sTitle || !sStatus || !sPriority) {
                sap.m.MessageBox.error("Please fill in all mandatory fields.");
                return;
            }

            // Update the context with new values
            oContext.setProperty("title", sTitle);
            oContext.setProperty("description", sDescription || "");
            oContext.setProperty("status_name", sStatus);
            oContext.setProperty("priority_name", sPriority);
            oContext.setProperty("developer_ID", sDeveloperID || null);

            // Enable busy state
            this.getView().setBusy(true);

            // Submit changes using submitBatch for OData V4
            oModel.submitBatch("default").then(() => {
                this.getView().setBusy(false);
                sap.m.MessageToast.show("Bug updated successfully!");
                this._oEditDialog.close();

                // Refresh the table on the main page
                const oTable = this.getOwnerComponent().byId("idBugsTable"); // Ensure the table ID is correct
                if (oTable) {
                    path: "/Bugs",
                    oTable.getBinding("items").refresh();
                }
            }).catch((oError) => {
                this.getView().setBusy(false);
                sap.m.MessageBox.error("Failed to update bug: " + oError.message);
            });
        },

        onDeletePress: function () {
            const oView = this.getView();
            const oContext = oView.getBindingContext();
            const oModel = this.getOwnerComponent().getModel(); // Use the OData V4 model
            const sBugTitle = oContext.getProperty("title");

            MessageBox.confirm(
                `Are you sure you want to delete bug '${sBugTitle}'?`, {
                    title: "Confirm Delete",
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            oContext.delete("$auto").then(() => {
                                MessageBox.success("Bug deleted successfully", {
                                    onClose: () => {
                                        this.onNavBack();
                                    }
                                });

                                // Refresh the model to update the UI
                                oModel.refresh();
                            }).catch((oError) => {
                                MessageBox.error("Error deleting bug: " + oError.message);
                            });
                        }
                    }.bind(this)
                }
            );
        },

        onSearch: function (oEvent) {
            // Build filter array
            const aFilter = [];
            const sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue"); // Handle both liveChange and search events

            if (sQuery) {
                aFilter.push(new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("title", sap.ui.model.FilterOperator.Contains, sQuery),
                        new sap.ui.model.Filter("description", sap.ui.model.FilterOperator.Contains, sQuery),
                        new sap.ui.model.Filter("status_name", sap.ui.model.FilterOperator.Contains, sQuery),
                        new sap.ui.model.Filter("priority_name", sap.ui.model.FilterOperator.Contains, sQuery)
                    ],
                    and: false // This makes it an OR filter
                }));
            }

            // Filter the table
            const oTable = this.byId("idBugsTable");
            const oBinding = oTable.getBinding("items");
            oBinding.filter(aFilter);
        }
    });
});