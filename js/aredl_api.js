export async function getLevelStats(level_id) {
    const url = "https://api.aredl.net/v2/api/aredl/levels/" + level_id.toString();

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error("There was a problem fetching the data: ", error);
        return "Error while getting level info!";
    }
}

export async function getAllLevels() {
    const url = "https://api.aredl.net/v2/api/aredl/levels/";

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error("There was a problem fetching the data: ", error);
        return "Error while getting all levels!";
    }
}

export async function getAllRecords(apiKey) {
    const url = "https://api.aredl.net/v2/api/aredl/submissions/@me?per_page=100";

    var headers = {
        "Authorization": `Bearer ${apiKey}`,
        "api-key": apiKey,
        "Accept": "application/json"
    };

    try {
        const response = await fetch(url, {
            headers
        });

        if (!response.ok) {
            if (response.status === 401) {
                return "Invalid credentials.";
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
                return "Generic error.";
            }
        }

        const data = await response.json();
        let recordData = data["data"];

        if (data["pages"] > 1) {
            for (let i = 0; i < data["pages"] - 1; i++) {
                try {
                    const newResponse = await fetch(url + "&page=" + (i + 2).toString(), {headers});

                    if (!newResponse.ok) {
                        throw new Error(`HTTP error! Status: ${newResponse.status}`);
                    }

                    const newData = await newResponse.json();

                    recordData = [ ...recordData, ...newData["data"]];
                } catch (error) {
                    console.error("There was a problem fetching the data: ", error);
                    return "Error while getting all records!";
                }
            }
        }

        return recordData;
    } catch (error) {
        console.error("There was a problem fetching the data: ", error);
        return "Generic error.";
    }
}