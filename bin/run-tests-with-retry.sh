#!/bin/bash

function retry {
    command="$*"
    retval=1
    attempt=1
    until [[ $retval -eq 0 ]] || [[ $attempt -gt 4 ]]; do
        # Execute inside of a subshell in case parent
        # script is running with "set -e"
        (
            set +e
            $command
        )
        retval=$?
        attempt=$(( $attempt + 1 ))
        if [[ $retval -ne 0 ]]; then
            # If there was an error wait 10 seconds
            sleep 1
        fi
    done
    exit $retval
}

yarn run ember build && retry yarn run ember test --path=dist
