#!/bin/bash

function retry {
    command="$*"
    retval=1
    attempt=1
    until [[ $retval -eq 0 ]] || [[ $attempt -gt 3 ]]; do
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
            sleep 10
        fi
    done
    if [[ $retval -ne 0 ]] && [[ $attempt -gt 3 ]]; then
        # Something is fubar, go ahead and exit
        exit $retval
    fi
}

retry yarn test:ember
