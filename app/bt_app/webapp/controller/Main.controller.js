sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/m/Select",
    "sap/ui/core/Item", // Corrected module name
    "sap/ui/core/routing/History",
    "../model/formatter"
], function (Controller, MessageToast, MessageBox, Dialog, Button, Input, Label, VBox, Select, Item, History, formatter) {
    "use strict";

    return Controller.extend("com.sap.btapp.controller.Main", {
        formatter: formatter,
        onInit: function () {
            // Retrieve the model from the Component
            var oModel = this.getOwnerComponent().getModel();
            oModel.refresh();
        },

        // Open the Add Bug dialog
        onAddBugButtonPress: function () {
            if (!this._oAddBugDialog) {
                this._oAddBugDialog = new Dialog({
                    title: "Add Bug",
                    contentWidth: "400px", // Set a fixed width for the dialog
                    content: new VBox({
                        width: "100%",
                        alignItems: "Center", // Center-align the content
                        justifyContent: "Center",
                        items: [
                            new VBox({
                                width: "100%",
                                items: [
                                    new Label({ text: "Title", required: true }),
                                    new Input({ id: "idTitleInput", placeholder: "Enter Title", width: "100%" })
                                ]
                            }).addStyleClass("sapUiSmallMarginBottom"),

                            new VBox({
                                width: "100%",
                                items: [
                                    new Label({ text: "Description" }),
                                    new Input({ id: "idDescriptionInput", placeholder: "Enter Description", width: "100%" })
                                ]
                            }).addStyleClass("sapUiSmallMarginBottom"),

                            new VBox({
                                width: "100%",
                                items: [
                                    new Label({ text: "Status", required: true }),
                                    new Select({
                                        id: "idStatusSelect",
                                        width: "100%",
                                        items: {
                                            path: "/Statuses",
                                            template: new Item({
                                                key: "{name}",
                                                text: "{name}"
                                            })
                                        }
                                    })
                                ]
                            }).addStyleClass("sapUiSmallMarginBottom"),

                            new VBox({
                                width: "100%",
                                items: [
                                    new Label({ text: "Priority", required: true }),
                                    new Select({
                                        id: "idPrioritySelect",
                                        width: "100%",
                                        items: {
                                            path: "/Priorities",
                                            template: new Item({
                                                key: "{name}",
                                                text: "{name}"
                                            })
                                        }
                                    })
                                ]
                            }).addStyleClass("sapUiSmallMarginBottom"),

                            new VBox({
                                width: "100%",
                                items: [
                                    new Label({ text: "Developer ID" }),
                                    new Input({ id: "idDeveloperInput", placeholder: "Enter Developer ID", width: "100%" })
                                ]
                            }).addStyleClass("sapUiSmallMarginBottom")
                        ]
                    }).addStyleClass("dialog-padding"), // Add custom padding class
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: this.onSaveBug.bind(this)
                    }),
                    endButton: new Button({
                        text: "Cancel",
                        press: function () {
                            this._oAddBugDialog.close();
                            this._oAddBugDialog.destroy(); // Clean up the dialog after closing
                        }.bind(this)
                    })
                });

                // Add the dialog to the view
                this.getView().addDependent(this._oAddBugDialog);
            }

            // Open the dialog
            this._oAddBugDialog.open();
        },

        // Save the new bug
        onSaveBug: function () {
            var oModel = this.getOwnerComponent().getModel();

            // Retrieve input values
            var sTitle = sap.ui.getCore().byId("idTitleInput").getValue();
            var sDescription = sap.ui.getCore().byId("idDescriptionInput").getValue();
            var sStatus = sap.ui.getCore().byId("idStatusSelect").getSelectedKey();
            var sPriority = sap.ui.getCore().byId("idPrioritySelect").getSelectedKey();
            var sDeveloperID = sap.ui.getCore().byId("idDeveloperInput").getValue();

            // Validate mandatory fields
            if (!sTitle || !sStatus || !sPriority) {
                MessageBox.error("Please fill in all mandatory fields.");
                return;
            }

            // Create payload for the new bug
            var oPayload = {
                title: sTitle,
                description: sDescription || "",
                status_name: sStatus,
                priority_name: sPriority,
                developer_ID: sDeveloperID || null
            };

            // Enable busy state
            this.getView().setBusy(true);

            // Create a new bug entry
            oModel.bindList("/Bugs").create(oPayload, true)
                .created()
                .then(function () {
                    this.getView().setBusy(false);
                    MessageToast.show("Bug added successfully!");
                    this._oAddBugDialog.close();

                    // Refresh the table to reflect the new entry
                    var oTable = this.byId("idBugsTable");
                    oTable.getBinding("items").refresh();
                }.bind(this))
                .catch(function (oError) {
                    this.getView().setBusy(false);
                    MessageBox.error("Failed to add bug: " + oError.message);
                }.bind(this));
        },

        // Delete the selected bug(s)
        onDeleteBugButtonPress: function () {
            const oTable = this.byId("idBugsTable");
            const aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                MessageBox.information("Please select at least one bug to delete");
                return;
            }

            MessageBox.confirm(
                "Are you sure you want to delete " + aSelectedItems.length + " selected bug(s)?", {
                    title: "Confirm Delete",
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            this.getView().setBusy(true);

                            // Create array of delete promises
                            const aDeletePromises = aSelectedItems.map(item => {
                                return item.getBindingContext().delete();
                            });

                            // Execute all deletes
                            Promise.all(aDeletePromises)
                                .then(() => {
                                    this.getView().setBusy(false);
                                    MessageBox.success(aSelectedItems.length + " bug(s) deleted successfully");
                                    oTable.getBinding("items").refresh();
                                    oTable.removeSelections();
                                })
                                .catch(error => {
                                    this.getView().setBusy(false);
                                    MessageBox.error("Error deleting bug(s): " + error.message);
                                });
                        }
                    }.bind(this)
                }
            );
        },

        onRowPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
            var oContext = oItem.getBindingContext();
            var sBugId = oContext.getProperty("ID");

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("BugDetails", {
                bugId: sBugId
            });
        },

        onSelectionChange: function (oEvent) {
            var oTable = this.byId("idBugsTable");
            var aSelectedItems = oTable.getSelectedItems();
            console.log("Selected Items:", aSelectedItems);
        },

        onSearchFieldLiveChange: function (oEvent) {
            // Build filter array
            const aFilter = [];
            const sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue"); // Handle both liveChange and search events

            if (sQuery) {
                const sQueryLowerCase = sQuery.toLowerCase(); // Convert query to lowercase for case-insensitive comparison

                aFilter.push(new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter({
                            path: "title",
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sQueryLowerCase,
                            caseSensitive: false // Custom logic for case-insensitivity
                        }),
                        new sap.ui.model.Filter({
                            path: "description",
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sQueryLowerCase,
                            caseSensitive: false
                        }),
                        new sap.ui.model.Filter({
                            path: "status_name",
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sQueryLowerCase,
                            caseSensitive: false
                        }),
                        new sap.ui.model.Filter({
                            path: "priority_name",
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sQueryLowerCase,
                            caseSensitive: false
                        })
                    ],
                    and: false // This makes it an OR filter
                }));
            }

            // Filter the table
            const oTable = this.byId("idBugsTable");
            const oBinding = oTable.getBinding("items");

            // Apply the filters
            oBinding.filter(aFilter);
        },

        onFilterButtonPress: function () {
            if (!this._oFilterDialog) {
                sap.ui.core.Fragment.load({
                    name: "com.sap.btapp.view.fragments.FilterDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oFilterDialog = oDialog;
                    this.getView().addDependent(this._oFilterDialog);
                    this._loadCurrentFilters(); // Load current filters into the dialog
                    this._oFilterDialog.open();
                }.bind(this));
            } else {
                this._loadCurrentFilters(); // Load current filters into the dialog
                this._oFilterDialog.open();
            }
        },

        _loadCurrentFilters: function () {
            const oTable = this.byId("idBugsTable");
            const oBinding = oTable.getBinding("items");
            const aFilters = oBinding.aFilters || []; // Get current filters

            // Load current filters into the dialog fields
            aFilters.forEach(filter => {
                switch (filter.sPath) {
                    case "status_name":
                        sap.ui.getCore().byId("idStatusSelect").setSelectedKey(filter.oValue1);
                        break;
                    case "priority_name":
                        sap.ui.getCore().byId("idPrioritySelect").setSelectedKey(filter.oValue1);
                        break;
                    case "developer_ID":
                        sap.ui.getCore().byId("idDeveloperInput").setValue(filter.oValue1);
                        break;
                }
            });
        },

        _resetFilterFields: function () {
            // Reset the Status dropdown
            sap.ui.getCore().byId("idStatusSelect").setSelectedKey(null);

            // Reset the Priority dropdown
            sap.ui.getCore().byId("idPrioritySelect").setSelectedKey(null);

            // Reset the Developer ID input field
            sap.ui.getCore().byId("idDeveloperInput").setValue("");
        },

        onApplyButtonPress: function () {
            const aFilters = [];

            // Get selected status
            const sSelectedStatus = sap.ui.getCore().byId("idStatusSelect").getSelectedKey();
            if (sSelectedStatus) {
                aFilters.push(new sap.ui.model.Filter("status_name", sap.ui.model.FilterOperator.EQ, sSelectedStatus));
            }

            // Get selected priority
            const sSelectedPriority = sap.ui.getCore().byId("idPrioritySelect").getSelectedKey();
            if (sSelectedPriority) {
                aFilters.push(new sap.ui.model.Filter("priority_name", sap.ui.model.FilterOperator.EQ, sSelectedPriority));
            }

            // Get developer ID
            const sDeveloperID = sap.ui.getCore().byId("idDeveloperInput").getValue();
            if (sDeveloperID) {
                aFilters.push(new sap.ui.model.Filter("developer_ID", sap.ui.model.FilterOperator.EQ, sDeveloperID));
            }

            // Get the table and its binding
            const oTable = this.byId("idBugsTable");
            const oBinding = oTable.getBinding("items");

            // Apply filters if any are selected, otherwise clear all filters
            if (aFilters.length > 0) {
                oBinding.filter(new sap.ui.model.Filter({
                    filters: aFilters,
                    and: true // Combine filters with AND
                }));
                oBinding.refresh();
            } else {
                oBinding.filter(null); // Clear all filters
            }

            // Close the dialog
            this._oFilterDialog.close();
        },

        onCancelButtonPress: function () {
            this._oFilterDialog.close();
            this._oFilterDialog.destroy(); // Destroy the dialog after closing
            this._oFilterDialog = null; // Reset the dialog reference
        },

        onClearFilterButtonPress: function () {
            // Reset the filter fields in the dialog
            this._resetFilterFields();

            // Clear all filters applied to the table
            const oTable = this.byId("idBugsTable");
            const oBinding = oTable.getBinding("items");
            oBinding.filter(null);
            this._oFilterDialog.close();

            MessageToast.show("Filters cleared. Showing all items.");
        }

    });
});