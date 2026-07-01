import sys
import os
from unittest.mock import MagicMock

# 1. Mock google.auth.default to prevent DefaultCredentialsError when initializing clients
import google.auth
mock_cred = MagicMock()
mock_cred.universe_domain = 'googleapis.com'
google.auth.default = MagicMock(return_value=(mock_cred, 'dummy-project'))

# 2. Import cmd_grade and run it
from google.agents.cli.eval.cmd_grade import cmd_grade

if __name__ == "__main__":
    traces_path = os.path.join("artifacts", "traces", "generated_traces.json")
    output_path = os.path.join("artifacts", "grade_results")
    config_path = os.path.join("tests", "eval", "eval_config.yaml")
    
    print(f"Starting local evaluation grading on traces: {traces_path} using config: {config_path}")
    
    try:
        cmd_grade.callback(
            traces_path=traces_path,
            output_path=output_path,
            config_path=config_path,
            project=None,
            region=None
        )
        print("Local evaluation grading completed successfully!")
    except Exception as e:
        print("Local evaluation grading failed!")
        import traceback
        traceback.print_exc()
        sys.exit(1)
