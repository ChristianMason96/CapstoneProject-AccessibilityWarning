import os
import json


def save_json_results(output_dir, file_name, data):
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, file_name)

    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)

    return file_path