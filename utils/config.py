import os
import json

_current_config_obj = None
_path = os.path.join("persistent", "config.json")

class Config:
    def _open_conf():
        global _current_config_obj
        if not os.path.exists(_path):
            print("No config file, making new")
            file = open(_path, "w+")
            file.write('{"startup_min_lastcheck_to_rescan": 15,"nominatim_domain": "","nominatim_scheme": "","live_check_freq": 10,"dead_check_freq": 60}')
            file.close()
        _current_config_obj = json.load(open(_path, "r"))

    def get_conf_option(option):
        if _current_config_obj is None: Config._open_conf()
        return _current_config_obj.get(option, None)