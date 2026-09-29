import { getLevelStats, getAllLevels, getAllRecords } from "./aredl_api.js"

var all_levels

async function addLevel(levelId) { 
    var level_info = await getLevelStats(levelId);

    if (level_info == "Error while getting level info!") {
        const error_text = document.createElement("p");
        error_text.textContent = "There was an error while getting the level info! Please try again.";
        document.body.appendChild(error_text);
        return;
    }

    var completed_levels = localStorage.getItem("completed_levels");

    completed_levels = JSON.parse(localStorage.getItem("completed_levels"));
    completed_levels.push(level_info);
    completed_levels.sort((a, b) => b.points - a.points);
    
    localStorage.setItem("completed_levels", JSON.stringify(completed_levels));

    await refreshList();
}

async function refreshList() {
    const level_container = document.getElementById("level_list_container");
    level_container.querySelectorAll('.level_object').forEach(el => el.remove());

    var all_completed_levels = JSON.parse(localStorage.getItem("completed_levels"));
    var total_points = 0.0;

    all_completed_levels.forEach((completed_level, index) => {
        if (completed_level["points"] != 0) {
            all_completed_levels[index] = all_levels.find(item => item.id === completed_level["id"]);

            

            total_points = total_points + all_completed_levels[index]["points"] / 10;

            var completed_level_text = document.createElement("p");

            completed_level_text.textContent = completed_level["name"] + " | " + (completed_level["points"] / 10).toString() + " points";
            completed_level_text.classList = ["level_list_item"];

            var remove_completed_level = document.createElement("button");
            remove_completed_level.textContent = " X ";
            remove_completed_level.dataset.level_index = index;
            remove_completed_level.classList = ["remove-completed-level"];

            remove_completed_level.addEventListener("click", (e) => {
                var list_completed_levels = JSON.parse(localStorage.getItem("completed_levels"));
                list_completed_levels.splice(Number(e.target.dataset.level_index), 1);
                localStorage.setItem("completed_levels", JSON.stringify(list_completed_levels));

                refreshList();
            })

            const inlineWrapper = document.createElement('div');
            inlineWrapper.style.display = 'flex';
            inlineWrapper.style.flexDirection = 'row-reverse';
            inlineWrapper.style.justifyContent = 'flex-end';
            inlineWrapper.style.alignItems = 'center';
            inlineWrapper.style.gap = "10px";
            inlineWrapper.classList = ["level_object"];

            inlineWrapper.style = `--bg-img: url('https://cdn.jsdelivr.net/gh/All-Rated-Extreme-Demon-List/Thumbnails@main/levels/cards/${completed_level["level_id"]}.webp')`

            inlineWrapper.appendChild(remove_completed_level);
            inlineWrapper.appendChild(completed_level_text);

            level_container.appendChild(inlineWrapper);
        };
    });

    localStorage.setItem("completed_levels", JSON.stringify(all_completed_levels));
    localStorage.setItem("totalPoints", total_points);

    var profileSummary = document.getElementById("profile-summary");
    var profileNameText = profileSummary.querySelector("#profile-name");

    if (localStorage.getItem("profileSetup") === "1") {
        profileNameText.textContent = localStorage.getItem("username") + " - " + localStorage.getItem("totalPoints").toString() + " Points";
        document.title = profileNameText.textContent + " | Local AREDL";
    };
}
async function addAREDLRecords(apiKey) {
    try {
        var ending = await getAllRecords(apiKey);

        if (ending === "Invalid credentials.") {
            document.getElementById("profile-setup").querySelector("#invalid-credentials").style.display = "block";
            return false;
        } else if (ending === "Generic error.") {
            document.getElementById("profile-setup").querySelector("#generic-error").style.display = "block";
            return false;
        }

        ending.forEach(async function(record, index) {
            console.log(record);
            await addLevel(record["level"]["level_id"]);
        });
    } catch (error) {
        console.log(error);
        document.getElementById("profile-setup").querySelector("#generic-error").style.display = "block";
        return false;
    }
    
    return true;
}

if (!localStorage.getItem("completed_levels")) {
    localStorage.setItem("completed_levels", JSON.stringify([]));
}

if (!localStorage.getItem("profileSetup") || localStorage.getItem("profileSetup") === "0") {
    localStorage.setItem("profileSetup", "0");
    localStorage.setItem("profilePicture", "");
}

document.addEventListener("DOMContentLoaded", () => {
    (async () => {
        all_levels = await getAllLevels();
        
        refreshList();

        var profileSetupSection = document.getElementById("profile-setup");
        var apiKeyTutorial = document.getElementById("aredl-api-key-tutorial");

        if (localStorage.getItem("profileSetup") === "0") {
            var uploadProfilePictureContainer = profileSetupSection.querySelector("#contains-upload-profile-picture");
            var uploadProfilePicture = uploadProfilePictureContainer.querySelector("#upload-profile-picture");
            var uploadProfilePictureInput = uploadProfilePictureContainer.querySelector("#profile-picture-input");
            var createProfileButtonContainer = profileSetupSection.querySelector("#contains-create-profile-button");
            var createProfileButton = createProfileButtonContainer.querySelector("#create-profile-button");
            var aredlApiKeyInputContainer = profileSetupSection.querySelector("#contains-aredl-api-key-input");
            var aredlApiKeyInput = aredlApiKeyInputContainer.querySelector("#aredl-api-key");
            var profileNameContainer = profileSetupSection.querySelector("#contains-profile-name");
            var profileName = profileNameContainer.querySelector("#profile-name");

            uploadProfilePicture.addEventListener("click", (e) => {
                uploadProfilePictureInput.click();
            });

            uploadProfilePictureInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (file.size > 2000000) {
                    uploadProfilePicture.innerHTML = "File too big! Try another. (max 2mb)";
                } else {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        localStorage.setItem("profilePicture", event.target.result);
                    };

                    uploadProfilePicture.innerHTML = "Selected! Click to change";
                    reader.readAsDataURL(file);
                };
            });

            createProfileButton.addEventListener("click", async function(e) {
                document.getElementById("profile-setup").querySelector("#invalid-credentials").style.display = "none";
                document.getElementById("profile-setup").querySelector("#generic-error").style.display = "none";
                var somethingWentWrong = false;

                if (aredlApiKeyInput.value != "") {
                    somethingWentWrong = await addAREDLRecords(aredlApiKeyInput.value);
                    somethingWentWrong = !somethingWentWrong;
                };

                if (!somethingWentWrong) {
                    createProfileButton.innerHTML = "Creating...";
                    localStorage.setItem("username", profileName.value);
                    localStorage.setItem("profileSetup", "1");
                    await new Promise(resolve => setTimeout(resolve, 500))
                    location.reload();
                };
            });

            profileSetupSection.style.display = "block";
            apiKeyTutorial.style.display = "block";
            document.getElementById("loading").style.display = "none";
        } else {
            profileSetupSection.remove();
            apiKeyTutorial.remove();

            var profileSummary = document.getElementById("profile-summary");
            var profileNameText = profileSummary.querySelector("#profile-name");
            var profilePictureIcon = profileSummary.querySelector("#profile-picture");
            
            profileNameText.textContent = localStorage.getItem("username") + " - " + localStorage.getItem("totalPoints").toString() + " Points";
            document.title = profileNameText.textContent + " | Local AREDL";
            profilePictureIcon.src = localStorage.getItem("profilePicture");

            const dropdown = document.getElementById("level-dropdown");
            const header = dropdown.querySelector(".header");
            const search = header.querySelector("#search")
            
            all_levels.forEach((item, index) => {
                var newDiv = document.createElement("div");
                newDiv.classList = ["option"];
                newDiv.dataset.value = index + 1;
                newDiv.style = `--bg-img: url('https://cdn.jsdelivr.net/gh/All-Rated-Extreme-Demon-List/Thumbnails@main/levels/cards/${item["level_id"]}.webp')`

                var newSpan = document.createElement("span");
                newSpan.innerHTML = `#${index + 1} - ${item["name"]} - ${item["points"] / 10}`;

                newDiv.appendChild(newSpan);
                dropdown.querySelector("#options").appendChild(newDiv);
            });
            
            const options = dropdown.querySelectorAll(".option");

            header.addEventListener("click", (e) => {
                e.stopPropagation();
                dropdown.classList.toggle("active");
            });

            options.forEach(option => {
                option.addEventListener("click", async () => {
                    const completed = JSON.parse(localStorage.getItem("completed_levels") || "[]");
                    const completedNames = new Set(completed.map(c => c["id"]));
                    const valueTarget = option.getAttribute("data-value");

                    if (!completedNames.has(all_levels[valueTarget - 1]["id"])) {
                        dropdown.classList.remove("active");

                        await addLevel(all_levels[valueTarget - 1]["level_id"]);
                    }
                });
            });

            document.addEventListener("click", () => {
                dropdown.classList.remove("active");
            });

            search.addEventListener("input", () => {
                const query = search.value.toLowerCase().trim();

                options.forEach(option => {
                    const text = option.querySelector("span").textContent.toLowerCase();
                    option.style.display = text.includes(query) ? "" : "none";
                });
            });

            const controlPanel = document.getElementById("control-panel");
            const uploadProfilePicture = controlPanel.querySelector("#upload-profile-picture2");
            const uploadProfilePictureInput = controlPanel.querySelector("#profile-picture-input2");

            controlPanel.querySelector("#username-change-button").addEventListener("click", () => {
                localStorage.setItem("username", controlPanel.querySelector("#username-change").value);
                location.reload();
            });

            uploadProfilePicture.addEventListener("click", (e) => {
                uploadProfilePictureInput.click();
            });

            uploadProfilePictureInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (file.size > 2000000) {
                    uploadProfilePicture.innerHTML = "File too big! Try another. (max 2mb)";
                } else {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        localStorage.setItem("profilePicture", event.target.result);
                    };
                    reader.readAsDataURL(file);
                    location.reload();
                };
            });

            profileSummary.style.display = "flex";
            document.getElementById("add-a-level-section").style.display = "block";
            document.getElementById("level-section").style.display = "block";
            controlPanel.style.display = "block";
            document.getElementById("loading").style.display = "none";
        };
    })();
});