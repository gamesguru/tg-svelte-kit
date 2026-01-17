#!/bin/bash

# Bash completion for local-ci.sh
# Source this file to enable completion: source scripts/local-ci-completion.bash

_local_ci_sh() {
    local cur opts
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    
    opts="quick lint check unit e2e kit cross ssrr async others legacy all"

    if [[ ${cur} == * ]] ; then
        # shellcheck disable=SC2207
        COMPREPLY=( $(compgen -W "${opts}" -- "${cur}") )
        return 0
    fi
}

# Bind to both relative path and full path usages if possible, usually just command name
complete -F _local_ci_sh local-ci.sh
complete -F _local_ci_sh ./scripts/local-ci.sh
complete -F _local_ci_sh scripts/local-ci.sh
