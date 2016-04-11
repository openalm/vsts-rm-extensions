
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

function normalizeDefinitionEnvironmentObject(definition) {
            definition =  normalizeDefinitionObject(definition);
            definition.environments.forEach(function (environment) {		
            environment.owner = null;
            environment.queueId = 0;
            });
            return definition;
        };


function normalizeDefinitionObject(definition) {
            definition.id = 0;
			definition.name = definition.name.concat('- Copy');           
            return definition;
        };

		
var fileImportDialog = (function(){
var fileContent = "";
  VSS.require(["VSS/Controls/FileInput"],
            function (Controls_FileInput) {
			    Controls_FileInput.FileInputControl.createControl($("body"), {
                maximumNumberOfFiles: 1,
                maximumTotalFileSize: 25 * 1024 * 1024,
				resultContentType: Controls_FileInput.FileInputControlContentType.RawText,
                updateHandler: function (updateEvent) {
                        if (updateEvent.files.length > 0 && updateEvent.files[0].content) {
						fileContent = updateEvent.files[0].content;
                            isImportEnabled = true;
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
			  try {
				definition = JSON.parse(data);
				definition = normalizeDefinitionEnvironmentObject(definition);
				window.sourceItemContext.view.openReleaseDefinition(definition);
				return true;
				}
				catch(ex) {
				 alert("File contains corrupt data");
				 return false;
				}
				
			});
             return true;
            }
        };

        dialogService.openDialog(contributionId, dialogOptions).then(function(dialog) {
		dialog.getContributionInstance("import-dialog-content").then(function (fileContentInstance) {
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
            // Load REST client
            VSS.require(["VSS/Service", "ReleaseManagement/Core/RestClient"],
            function (VSS_Service, RM_WebApi) {
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
            // Load REST client
            VSS.require(["VSS/Service", "ReleaseManagement/Core/RestClient"],
            function (VSS_Service, RM_WebApi) {
			var vsoContext = VSS.getWebContext();
            // Get a RM client to make REST calls
            var rmClient = VSS_Service.getCollectionClient(RM_WebApi.ReleaseHttpClient);
			rmClient.getReleaseDefinition(vsoContext.project.id,sourceItemContext.definition.id).then(function(definition){
			    definition = normalizeDefinitionObject(definition);
                sourceItemContext.view.openReleaseDefinition(definition);
            });
        });
     }
	} 
}());


VSS.register("importDefinitionToolbarMenu", importDefinitionToolbarMenu);
VSS.register("exportDefinitionContextMenu", exportDefinitionContextMenu);
VSS.register("cloneDefinitionContextMenu", cloneDefinitionContextMenu);


