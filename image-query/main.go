package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/google/go-containerregistry/pkg/name"
	"github.com/google/go-containerregistry/pkg/v1/remote"
	"github.com/google/go-containerregistry/pkg/v1/types"
)

const unknown = "unknown"

type Response struct {
	Architectures []string `json:"architectures"`
}

func main() {
	port := os.Getenv("HTTP_PORT")
	if port == "" {
		port = "8080"
	}
	http.HandleFunc("/", getArchs)

	log.Println("Starting to listen on port " + port)
	log.Println(http.ListenAndServe(":"+port, nil))
}

func getArchs(res http.ResponseWriter, req *http.Request) {
	image := req.RequestURI[1:]
	log.Println("Parsing image " + image)
	if image == "" {
		res.WriteHeader(http.StatusNotFound)
		log.Println("Image " + image + " not found")
		return
	}
	arch := make([]string, 0)
	ref, err := name.ParseReference(image)

	if err != nil {
		parseResult(arch, res)
		return
	}

	raw, err := remote.Get(ref)
	if err != nil {
		parseResult(arch, res)
		return
	}

	switch raw.MediaType {
	case types.OCIImageIndex, types.DockerManifestList:
		index, err := remote.Index(ref)
		if err != nil {
			parseResult(arch, res)
			return
		}

		im, err := index.IndexManifest()
		if err != nil {
			parseResult(arch, res)
			return
		}

		for _, m := range im.Manifests {
			if m.Platform.OS == unknown || m.Platform.Architecture == unknown {
				continue
			}
			arch = append(arch, m.Platform.OS+"/"+m.Platform.Architecture)
		}
	case types.OCIManifestSchema1, types.DockerManifestSchema1, types.DockerManifestSchema2:
		img, err := remote.Image(ref)
		if err != nil {
			parseResult(arch, res)
			return
		}

		m, err := img.Manifest()
		if err != nil {
			parseResult(arch, res)
			return
		}

		for _, m := range m.Layers {
			if m.Platform.OS == unknown || m.Platform.Architecture == unknown {
				continue
			}
			arch = append(arch, m.Platform.OS+"/"+m.Platform.Architecture)
		}
	default:
		if raw.Platform.OS != unknown && raw.Platform.Architecture != unknown {
			arch = append(arch, raw.Platform.OS+"/"+raw.Platform.Architecture)
		}
	}

	parseResult(arch, res)
}

func parseResult(arch []string, res http.ResponseWriter) {
	body, err := json.Marshal(Response{
		Architectures: arch,
	})
	if err != nil {
		log.Println("Failed to marshal " + strings.Join(arch, ","))
		res.WriteHeader(http.StatusInternalServerError)
		return
	}
	log.Println("Result :" + string(body))
	res.Write(body)
}
