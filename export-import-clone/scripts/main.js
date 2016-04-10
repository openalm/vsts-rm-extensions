
function downloadContent(data, name) {
    var file = new Blob([data], {type: 'application/json'});
    if(window.navigator && window.navigator.msSaveBlob){
        window.navigator.msSaveBlob(file, name);
    }
    else{
        var a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = name;
        a.click();
    }
}


var isImportEnabled = false;
var fileImportDialog = (function(){
var fileContent = "xyz";
  VSS.require(["VSS/Controls/FileInput"],
            function (Controls_FileInput) {
			    Controls_FileInput.FileInputControl.createControl($("body"), {
                maximumNumberOfFiles: 1,
                maximumTotalFileSize: 25 * 1024 * 1024,
				resultContentType: Controls_FileInput.FileInputControlContentType.RawText,
                updateHandler: function (updateEvent) {
                    if (updateEvent.loading) {
                        isImportEnabled = false;
                    }
                    else {
                        if (updateEvent.files.length > 0 && updateEvent.files[0].content) {
						fileContent = updateEvent.files[0].content;
                            isImportEnabled = true;
                        }
                        else {
                            isImportEnabled = false;
                        }
                    }
                }
            });
			});
			
			return  {
			  getFileData: function() {
			  return fileContent;
			  }
			};
}());

var importDefinitionToolbarMenu = (function () {
    "use strict";

    return {
        execute: function (sourceItemContext) {
		var definition;
		window.sourceItemContext = sourceItemContext;
        VSS.getService(VSS.ServiceIds.Dialog).then(function(dialogService) {
        var extensionCtx = VSS.getExtensionContext();
        // Build absolute contribution id for dialogContent
        var contributionId = extensionCtx.publisherId + "." + extensionCtx.extensionId + ".import-dialog-content";
        var fileContent;
        // Show dialog
        var dialogOptions = {
            title: "Import Release definition",
            width: 500,
            height: 300,
			okText: "Import",
			cancelText: "Cancel",
			getDialogResult: function() {
			
			fileContent.getFileData().then(function(data){
				definition = JSON.parse(data);
				definition.id = 0;
				definition.name = definition.name.concat('- Copy')
				window.sourceItemContext.view.openReleaseDefinition(definition);
			});
                
            
            },
			okCallback: function (result) {
                // Log the result to the console
                console.log(JSON.stringify(result));
            }
        };

        dialogService.openDialog(contributionId, dialogOptions).then(function(dialog) {
		dialog.getContributionInstance("import-dialog-content").then(function (fileContentInstance) {

                // Keep a reference of registration form instance (to be used above in dialog options)
                fileContent = fileContentInstance;
			});
			
		   dialog.updateOkButton(true); 
		});
    });
	  
      }
    }
}());

var exportDefinitionContextMenu = (function () {
    "use strict";

    return {
        execute: function (sourceItemContext) {
            // Load VSTS controls and REST client
            VSS.require(["VSS/Controls", "VSS/Service", "ReleaseManagement/Core/RestClient"],
            function (Controls, VSS_Service, RM_WebApi) {
            var vsoContext = VSS.getWebContext();
            // Get a RM client to make REST calls
            var rmClient = VSS_Service.getCollectionClient(RM_WebApi.ReleaseHttpClient);
            rmClient.getReleaseDefinition(vsoContext.project.id,sourceItemContext.definition.id).then(function(def){
                downloadContent(JSON.stringify(def), def.name + ".json");
            }); 
        });
      }
    }
}());

var cloneDefinitionContextMenu = (function () {
    "use strict";

    return {
        execute: function (sourceItemContext) {
            // Load VSTS controls and REST client
            VSS.require(["VSS/Controls", "VSS/Service", "ReleaseManagement/Core/RestClient"],
            function (Controls, VSS_Service, RM_WebApi) {
                var newDefinitionName = prompt("New definition name:", sourceItemContext.definition.name + "_clone");
                if (newDefinitionName != null)
                {
                    sourceItemContext.view.logMessage("Creating " + newDefinitionName + "...");
                    var vsoContext = VSS.getWebContext();
                    // Get a RM client to make REST calls
                    var rmClient = VSS_Service.getCollectionClient(RM_WebApi.ReleaseHttpClient);
                    rmClient.getReleaseDefinition(vsoContext.project.id,sourceItemContext.definition.id).then(function(def){
                        def.name = newDefinitionName;
                        rmClient.createReleaseDefinition(def, vsoContext.project.id).then(() => {
                            sourceItemContext.view.refresh();
                            sourceItemContext.view.logMessage("Cloned \'"+ sourceItemContext.definition.name +"\' and created \'" + newDefinitionName + "\'");
                        }, function(error){
                            sourceItemContext.view.logError(error);
                        });
                    }, function(error){
                        sourceItemContext.view.logError(error);
                    });
                }
            });
        }
    }
}());

var newCloneDefinitionContextMenu = (function () {
    "use strict";

    return {
        execute: function (sourceItemContext) {
            // Load VSTS controls and REST client
            VSS.require(["VSS/Controls", "VSS/Service", "ReleaseManagement/Core/RestClient"],
            function (Controls, VSS_Service, RM_WebApi) {
			var vsoContext = VSS.getWebContext();
            // Get a RM client to make REST calls
            var rmClient = VSS_Service.getCollectionClient(RM_WebApi.ReleaseHttpClient);
			rmClient.getReleaseDefinition(vsoContext.project.id,sourceItemContext.definition.id).then(function(def){
			    def.id = 0;
				def.name = def.name.concat('- Copy')
                sourceItemContext.view.openReleaseDefinition(def);
            });
        });
     }
	} 
}());


VSS.register("importDefinitionToolbarMenu", importDefinitionToolbarMenu);
VSS.register("exportDefinitionContextMenu", exportDefinitionContextMenu);
VSS.register("newCloneDefinitionContextMenu", newCloneDefinitionContextMenu);


